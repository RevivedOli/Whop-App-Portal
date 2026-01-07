import { headers } from 'next/headers';
import { verifyUserToken } from '@/lib/whop-api';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/admin/knowledge/courses/status
 * 
 * Updates the training status for a lesson.
 * 
 * Request body:
 * {
 *   companyId: string;
 *   lessonId: string;
 *   courseId: string;
 *   chapterId?: string;
 *   title: string;
 *   videoId?: string;
 *   status: 'pending' | 'transcribing' | 'transcribe_failed' | 'transcribed' | 'training' | 'train_failed' | 'trained';
 *   errorMessage?: string;
 * }
 */
export async function POST(request: Request): Promise<Response> {
	console.log('[admin/knowledge/courses/status] Request received');

	try {
		const requestHeaders = await headers();
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url);
		if (!tokenData) {
			console.error('[admin/knowledge/courses/status] Authentication failed');
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 },
			);
		}

		const body = await request.json();
		
		// Log the full request body to debug embed information
		console.log('[admin/knowledge/courses/status] Request body:', {
			lessonId: body.lessonId,
			has_embed_id: !!body.embed_id,
			has_embed_type: !!body.embed_type,
			embed_id: body.embed_id,
			embed_type: body.embed_type,
			has_video_asset: !!body.video_asset,
		});
		
		const {
			companyId: companyIdFromBody,
			lessonId,
			courseId,
			chapterId,
			title,
			videoId,
			status,
			errorMessage,
			playbackId,
			signedVideoPlaybackToken,
			embed_id,
			embed_type,
			video_source_type,
			metadata,
		} = body;

		const companyId = companyIdFromBody || tokenData.companyId;

		if (!companyId || !lessonId || !courseId || !title || !status) {
			return Response.json(
				{ error: 'Missing required fields: companyId, lessonId, courseId, title, status' },
				{ status: 400 },
			);
		}

		const validStatuses = ['pending', 'transcribing', 'transcribe_failed', 'transcribed', 'training', 'train_failed', 'trained'];
		if (!validStatuses.includes(status)) {
			return Response.json(
				{ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
				{ status: 400 },
			);
		}

		console.log('[admin/knowledge/courses/status] Updating status', {
			companyId,
			lessonId,
			status,
		});

		// Fetch company details to get the route (slug)
		let companySlug: string | null = null;
		let coursesExperienceId: string | null = null;
		
		try {
			// First, fetch company details to get the route/slug using user-specific SDK
			const company = await tokenData.whop.companies.retrieve(companyId);
			companySlug = company?.route || null;
			console.log('[admin/knowledge/courses/status] Company details:', {
				companyId,
				companySlug,
			});
		} catch (error) {
			console.error('[admin/knowledge/courses/status] Error fetching company details:', error);
		}
		
		// Find the Courses app experience for this company
		try {
			const experiencesResponse = await tokenData.whop.experiences.list({
				company_id: companyId,
			});
			
			// Find the experience with appName === "Courses"
			const coursesExperience = experiencesResponse.data?.find((exp) => {
				return exp.app?.name === 'Courses';
			});
			
			if (coursesExperience) {
				coursesExperienceId = coursesExperience.id;
				console.log('[admin/knowledge/courses/status] Found Courses experience:', {
					experienceId: coursesExperienceId,
					experienceName: coursesExperience.name,
				});
			} else {
				console.warn('[admin/knowledge/courses/status] No Courses experience found for company');
			}
		} catch (error) {
			console.error('[admin/knowledge/courses/status] Error fetching experiences:', error);
		}

		const supabase = createSupabaseClient();

		// Upsert the training status record
		// Extract video_id, playback_id, and signed token from video_asset
		// ALWAYS prioritize video_asset.playback_id - this is the Mux Playback ID we need
		let finalVideoId = videoId;
		let finalPlaybackId = playbackId;
		let finalSignedToken = signedVideoPlaybackToken;
		
		// Extract embed information for YouTube/Loom videos
		const finalEmbedId = embed_id || null;
		const finalEmbedType = embed_type || null;
		
		// Determine video source type (use provided value or determine from available fields)
		let videoSourceType: 'mux' | 'youtube' | 'loom' | null = video_source_type || null;
		
		if (body.video_asset) {
			// Log the video_asset structure for debugging
			console.log('[admin/knowledge/courses/status] video_asset structure:', {
				has_asset_id: !!body.video_asset.asset_id,
				has_playback_id: !!body.video_asset.playback_id,
				playback_id_value: body.video_asset.playback_id,
				has_signed_playback_id: !!body.video_asset.signed_playback_id,
				signed_playback_id_value: body.video_asset.signed_playback_id,
				has_id: !!body.video_asset.id,
				keys: Object.keys(body.video_asset),
				asset_id: body.video_asset.asset_id,
				status: body.video_asset.status,
			});
			
			// video_id should be the asset_id (Mux Asset ID) - use video_asset if not provided or fallback
			finalVideoId = body.video_asset.asset_id || finalVideoId || body.video_asset.id || null;
			
			// playback_id is CRITICAL - ALWAYS use video_asset.playback_id if available (this is the Mux Playback ID)
			// This is the correct field from the Whop Courses API
			// Note: playback_id might be null if the video hasn't finished processing
			if (body.video_asset.playback_id) {
				finalPlaybackId = body.video_asset.playback_id;
				console.log('[admin/knowledge/courses/status] Using playback_id from video_asset:', finalPlaybackId);
			} else if (body.video_asset.signed_playback_id) {
				// Fallback: Sometimes playback_id might be in signed_playback_id field
				// Extract the playback_id from the signed token if it's in URL format
				const signedPlaybackId = body.video_asset.signed_playback_id;
				// If it's a URL, extract the playback_id from it
				// Format might be: https://stream.mux.com/{playback_id}?token=...
				const urlMatch = signedPlaybackId.match(/stream\.mux\.com\/([^?\/]+)/);
				if (urlMatch) {
					finalPlaybackId = urlMatch[1];
					console.log('[admin/knowledge/courses/status] Extracted playback_id from signed_playback_id URL:', finalPlaybackId);
				} else {
					// If it's not a URL, it might be the playback_id directly
					finalPlaybackId = signedPlaybackId;
					console.log('[admin/knowledge/courses/status] Using signed_playback_id as playback_id:', finalPlaybackId);
				}
			} else if (body.video_asset.playbackId) {
				// Try camelCase variant
				finalPlaybackId = body.video_asset.playbackId;
				console.log('[admin/knowledge/courses/status] Using playbackId (camelCase) from video_asset:', finalPlaybackId);
			} else if (!finalPlaybackId) {
				// Fallback to provided playbackId if video_asset doesn't have it
				console.warn('[admin/knowledge/courses/status] video_asset.playback_id not found, using provided playbackId:', playbackId);
			}
			
			// Ensure we're NOT using asset_id as playback_id (they are different!)
			if (finalPlaybackId && finalPlaybackId === body.video_asset.asset_id && body.video_asset.asset_id !== body.video_asset.playback_id) {
				console.error('[admin/knowledge/courses/status] ERROR: playback_id matches asset_id but they should be different!');
				console.error('[admin/knowledge/courses/status] asset_id:', body.video_asset.asset_id);
				console.error('[admin/knowledge/courses/status] playback_id from video_asset:', body.video_asset.playback_id);
				// Force use the correct playback_id from video_asset
				finalPlaybackId = body.video_asset.playback_id || null;
			}
			
			// signedVideoPlaybackToken - prioritize video_asset if available
			// This is CRITICAL - required for Mux video URL authentication
			if (body.video_asset.signed_video_playback_token) {
				finalSignedToken = body.video_asset.signed_video_playback_token;
				console.log('[admin/knowledge/courses/status] Using signed_video_playback_token from video_asset');
			} else if (body.video_asset.signedVideoPlaybackToken) {
				finalSignedToken = body.video_asset.signedVideoPlaybackToken;
				console.log('[admin/knowledge/courses/status] Using signedVideoPlaybackToken (camelCase) from video_asset');
			} else if (body.video_asset.signed_token) {
				finalSignedToken = body.video_asset.signed_token;
				console.log('[admin/knowledge/courses/status] Using signed_token from video_asset');
			}
			
			// Log available token fields for debugging
			console.log('[admin/knowledge/courses/status] Token extraction:', {
				has_signed_video_playback_token: !!body.video_asset.signed_video_playback_token,
				has_signedVideoPlaybackToken: !!body.video_asset.signedVideoPlaybackToken,
				has_signed_token: !!body.video_asset.signed_token,
				final_token_set: !!finalSignedToken,
			});
		}
		
		// Determine video source type based on available fields (only if not already set)
		if (!videoSourceType) {
			if (finalPlaybackId || body.video_asset?.playback_id) {
				videoSourceType = 'mux';
			} else if (finalEmbedType === 'youtube' || finalEmbedType === 'loom') {
				videoSourceType = finalEmbedType;
			} else if (body.video_asset) {
				// If we have video_asset but no playback_id, it might still be Mux (processing)
				videoSourceType = 'mux';
			}
		}
		
		// Validate that video_source_type is set (required for backend processing)
		if (!videoSourceType && status === 'pending') {
			return Response.json(
				{ error: 'Missing video_source_type. Unable to determine video source type. Please ensure the lesson has a video (uploaded, YouTube, or Loom).' },
				{ status: 400 },
			);
		}
		
		// Validate that we have playback_id (required for Mux video URLs only)
		if (videoSourceType === 'mux' && !finalPlaybackId) {
			console.error('[admin/knowledge/courses/status] ERROR: Missing playback_id! Cannot proceed without it.', {
				provided_playbackId: playbackId,
				video_asset_keys: body.video_asset ? Object.keys(body.video_asset) : null,
				video_asset: body.video_asset ? {
					has_asset_id: !!body.video_asset.asset_id,
					has_playback_id: !!body.video_asset.playback_id,
					playback_id_value: body.video_asset.playback_id,
					has_signed_playback_id: !!body.video_asset.signed_playback_id,
					signed_playback_id_value: body.video_asset.signed_playback_id,
					asset_id: body.video_asset.asset_id,
					status: body.video_asset.status,
				} : null,
			});
			
			// Check if video is still processing
			const videoStatus = body.video_asset?.status;
			if (videoStatus && videoStatus !== 'ready') {
				return Response.json(
					{ 
						error: `Video is still processing (status: ${videoStatus}). playback_id will be available when the video is ready.`,
						video_status: videoStatus,
					},
					{ status: 400 },
				);
			}
			
			return Response.json(
				{ error: 'Missing playback_id. The video_asset must contain a playback_id field. The video may still be processing.' },
				{ status: 400 },
			);
		}
		
		console.log('[admin/knowledge/courses/status] Final values:', {
			video_id: finalVideoId,
			playback_id: finalPlaybackId,
			has_token: !!finalSignedToken,
			token_preview: finalSignedToken ? `${finalSignedToken.substring(0, 20)}...` : 'MISSING',
			video_source_type: videoSourceType,
			embed_id: finalEmbedId,
			embed_type: finalEmbedType,
		});
		
		// Validate that we have signed_video_playback_token (required for Mux video URLs only)
		if (videoSourceType === 'mux' && !finalSignedToken) {
			console.error('[admin/knowledge/courses/status] ERROR: Missing signed_video_playback_token! Cannot proceed without it.', {
				provided_signedVideoPlaybackToken: signedVideoPlaybackToken ? 'provided' : 'not provided',
				video_asset_keys: body.video_asset ? Object.keys(body.video_asset) : null,
				video_asset: body.video_asset ? {
					has_signed_video_playback_token: !!body.video_asset.signed_video_playback_token,
					has_signedVideoPlaybackToken: !!body.video_asset.signedVideoPlaybackToken,
					has_signed_token: !!body.video_asset.signed_token,
				} : null,
			});
			return Response.json(
				{ error: 'Missing signed_video_playback_token. The video_asset must contain a signed_video_playback_token field for video authentication.' },
				{ status: 400 },
			);
		}

		// Generate the full lesson URL if we have all required components
		let lessonUrl: string | null = null;
		if (companySlug && coursesExperienceId && courseId && lessonId) {
			lessonUrl = `https://whop.com/joined/${companySlug}/lessons-${coursesExperienceId}/app/courses/${courseId}/lessons/${lessonId}/`;
			console.log('[admin/knowledge/courses/status] Generated lesson URL:', lessonUrl);
		} else {
			console.warn('[admin/knowledge/courses/status] Cannot generate lesson URL - missing required fields:', {
				companySlug: !!companySlug,
				coursesExperienceId: !!coursesExperienceId,
				courseId: !!courseId,
				lessonId: !!lessonId,
			});
		}

		const updateData: any = {
			whop_company_id: companyId,
			course_id: courseId,
			chapter_id: chapterId || null,
			lesson_id: lessonId,
			title,
			video_id: finalVideoId || null,
			playback_id: finalPlaybackId || null,
			signed_video_playback_token: finalSignedToken || null,
			video_source_type: videoSourceType,
			embed_id: finalEmbedId,
			embed_type: finalEmbedType,
			status,
			error_message: errorMessage || null,
			metadata: metadata || {},
			company_slug: companySlug || null,
			experience_id: coursesExperienceId || null,
			lesson_url: lessonUrl || null,
			updated_at: new Date().toISOString(),
		};

		// Set trained_at timestamp if status is 'trained'
		if (status === 'trained') {
			updateData.trained_at = new Date().toISOString();
		} else {
			// Keep existing trained_at if it exists, otherwise set to null
			// This preserves the timestamp if status changes from trained to something else and back
		}

		const { data, error } = await supabase
			.from('courses')
			.upsert(updateData, {
				onConflict: 'whop_company_id,lesson_id',
			})
			.select()
			.single();

		if (error) {
			console.error('[admin/knowledge/courses/status] Database error:', error);
			return Response.json(
				{ error: 'Failed to update training status', details: error.message },
				{ status: 500 },
			);
		}

		console.log('[admin/knowledge/courses/status] Status updated successfully');
		return Response.json({ success: true, data });
	} catch (error) {
		console.error('[admin/knowledge/courses/status] Error:', error);
		return Response.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		);
	}
}

