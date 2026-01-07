import { headers } from 'next/headers';
import { verifyUserToken } from '@/lib/whop-api';

/**
 * GET /api/admin/knowledge/courses/[courseId]/chapters/[chapterId]/lessons
 * 
 * Fetches detailed lesson information for a specific chapter.
 * This is called on-demand when a chapter is expanded to reduce API calls.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ courseId: string; chapterId: string }> }
): Promise<Response> {
	console.log('[admin/knowledge/courses/[courseId]/chapters/[chapterId]/lessons] Request received');

	try {
		const { courseId, chapterId } = await params;
		const requestHeaders = await headers();
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url);
		if (!tokenData) {
			console.error('[admin/knowledge/courses/[courseId]/chapters/[chapterId]/lessons] Authentication failed');
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 },
			);
		}

		console.log('[admin/knowledge/courses/[courseId]/chapters/[chapterId]/lessons] Fetching lesson details', {
			courseId,
			chapterId,
		});

		// Use list_course_lessons with chapter_id to get lessons for this chapter
		// This includes thumbnail and other details using user-specific SDK
		const lessonsResponse = await tokenData.whop.courseLessons.list({
			chapter_id: chapterId,
		});

		if (!lessonsResponse || !lessonsResponse.data) {
			return Response.json(
				{ error: 'No lessons found for this chapter' },
				{ status: 404 },
			);
		}

		// Fetch detailed lesson information for each lesson (to get video_asset and thumbnail)
		const lessonsWithDetails = await Promise.all(
			lessonsResponse.data.map(async (lesson) => {
				try {
					// Get full lesson details to access video_asset and thumbnail with token using user-specific SDK
					const lessonDetail = await tokenData.whop.courseLessons.retrieve(lesson.id);
					
					// Log the full lesson detail structure for debugging (especially for YouTube/Loom)
					console.log(`[lessons] Lesson ${lessonDetail.id} full structure:`, {
						keys: Object.keys(lessonDetail),
						has_video_asset: !!(lessonDetail as any).video_asset,
						has_embed_id: !!(lessonDetail as any).embed_id,
						has_embed_type: !!(lessonDetail as any).embed_type,
						lesson_type: (lessonDetail as any).lesson_type,
						raw_embed_id: (lessonDetail as any).embed_id,
						raw_embed_type: (lessonDetail as any).embed_type,
					});
					
					// For video lessons with Mux video_asset, construct Mux thumbnail URL
					// Format: https://image.mux.com/{playback_id}/thumbnail.webp?token={signed_thumbnail_playback_token}
					let thumbnailUrl = null;
					if ((lessonDetail as any).video_asset?.playback_id) {
						// Construct Mux thumbnail URL with playback_id
						// Note: Token may need to be added if required for authentication
						thumbnailUrl = `https://image.mux.com/${(lessonDetail as any).video_asset.playback_id}/thumbnail.webp`;
					} else if ((lessonDetail as any).thumbnail?.url) {
						// Use the thumbnail URL from the API if no video_asset
						thumbnailUrl = (lessonDetail as any).thumbnail.url;
					}
					
					// Extract video_asset with all available fields
					const videoAsset = (lessonDetail as any).video_asset || null;
					
					// Extract embed information for YouTube/Loom videos
					// Check multiple possible locations for embed data
					const embedId = (lessonDetail as any).embed_id || 
						(lessonDetail as any).embed?.id || 
						(lessonDetail as any).embedId || 
						null;
					const embedType = (lessonDetail as any).embed_type || 
						(lessonDetail as any).embed?.type || 
						(lessonDetail as any).embedType || 
						null;
					
					// Determine video source type
					let videoSourceType: 'mux' | 'youtube' | 'loom' | null = null;
					if (videoAsset?.playback_id) {
						videoSourceType = 'mux';
					} else if (embedType === 'youtube') {
						videoSourceType = 'youtube';
					} else if (embedType === 'loom') {
						videoSourceType = 'loom';
					}
					
					// Log video_asset structure for debugging
					if (videoAsset) {
						console.log(`[lessons] Lesson ${lessonDetail.id} video_asset structure:`, {
							has_asset_id: !!videoAsset.asset_id,
							has_playback_id: !!videoAsset.playback_id,
							has_id: !!videoAsset.id,
							keys: Object.keys(videoAsset),
						});
					}
					
					// Log embed information for debugging
					if (embedId || embedType) {
						console.log(`[lessons] Lesson ${lessonDetail.id} embed information:`, {
							embed_id: embedId,
							embed_type: embedType,
							video_source_type: videoSourceType,
						});
					}
					
					// Include signed token if available (check various possible field names)
					// CRITICAL: We need signed_video_playback_token for Mux video URL authentication
					if (videoAsset) {
						// Prioritize the signed_video_playback_token from video_asset first
						videoAsset.signed_video_playback_token = 
							videoAsset.signed_video_playback_token ||
							videoAsset.signedVideoPlaybackToken ||
							(lessonDetail as any).signed_video_playback_token ||
							(lessonDetail as any).signedVideoPlaybackToken ||
							null;
						
						// Log token extraction for debugging
						if (!videoAsset.signed_video_playback_token) {
							console.warn(`[lessons] WARNING: Lesson ${lessonDetail.id} missing signed_video_playback_token`, {
								video_asset_keys: Object.keys(videoAsset),
								has_signed_video_playback_token: !!videoAsset.signed_video_playback_token,
								has_signedVideoPlaybackToken: !!videoAsset.signedVideoPlaybackToken,
							});
						}
						
						// Ensure playback_id is explicitly set and not confused with asset_id
						// Log warning if they're the same (which shouldn't happen)
						if (videoAsset.asset_id && videoAsset.playback_id && videoAsset.asset_id === videoAsset.playback_id) {
							console.warn(`[lessons] WARNING: Lesson ${lessonDetail.id} has asset_id === playback_id (unusual)`);
						}
					}
					
					return {
						id: lessonDetail.id,
						title: lessonDetail.title,
						order: lessonDetail.order,
						lesson_type: lessonDetail.lesson_type,
						thumbnail: thumbnailUrl ? { url: thumbnailUrl } : null,
						video_asset: videoAsset,
						embed_id: embedId,
						embed_type: embedType as 'youtube' | 'loom' | undefined,
					};
				} catch (error) {
					console.error(`[admin/knowledge/courses/[courseId]/chapters/[chapterId]/lessons] Error fetching lesson detail ${lesson.id}:`, error);
					// Return lesson info from list (has thumbnail but no video_asset)
					// Try to extract embed info from list response if available
					const embedIdFromList = (lesson as any).embed_id || null;
					const embedTypeFromList = (lesson as any).embed_type || null;
					
					return {
						id: lesson.id,
						title: lesson.title,
						order: lesson.order,
						lesson_type: lesson.lesson_type,
						thumbnail: (lesson as any).thumbnail || null,
						video_asset: null,
						embed_id: embedIdFromList,
						embed_type: embedTypeFromList as 'youtube' | 'loom' | undefined,
					};
				}
			})
		);

		console.log(`[admin/knowledge/courses/[courseId]/chapters/[chapterId]/lessons] Returning ${lessonsWithDetails.length} lessons`);
		return Response.json({ lessons: lessonsWithDetails });
	} catch (error) {
		console.error('[admin/knowledge/courses/[courseId]/chapters/[chapterId]/lessons] Error:', error);
		return Response.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		);
	}
}

