import { headers } from 'next/headers'
import { verifyUserToken } from '@/lib/whop-api'
import { createSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/knowledge/courses/status
 * 
 * Updates the training status for a lesson.
 */
export async function POST(request: Request): Promise<Response> {
	console.log('[api/knowledge/courses/status] Request received')

	try {
		const requestHeaders = await headers()
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url)
		if (!tokenData) {
			console.error('[api/knowledge/courses/status] Authentication failed')
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 },
			)
		}

		const body = await request.json()
		
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
			video_asset,
		} = body

		const companyId = companyIdFromBody || tokenData.companyId

		if (!companyId || !lessonId || !courseId || !title || !status) {
			return Response.json(
				{ error: 'Missing required fields: companyId, lessonId, courseId, title, status' },
				{ status: 400 },
			)
		}

		const validStatuses = ['pending', 'transcribing', 'transcribe_failed', 'transcribed', 'training', 'train_failed', 'trained']
		if (!validStatuses.includes(status)) {
			return Response.json(
				{ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
				{ status: 400 },
			)
		}

		// Fetch company details to get the route (slug)
		let companySlug: string | null = null
		let coursesExperienceId: string | null = null
		
		try {
			const company = await tokenData.whop.companies.retrieve(companyId)
			companySlug = company?.route || null
		} catch (error) {
			console.error('[api/knowledge/courses/status] Error fetching company details:', error)
		}
		
		try {
			const experiencesResponse = await tokenData.whop.experiences.list({
				company_id: companyId,
			})
			
			const coursesExperience = experiencesResponse.data?.find((exp) => {
				return exp.app?.name === 'Courses'
			})
			
			if (coursesExperience) {
				coursesExperienceId = coursesExperience.id
			}
		} catch (error) {
			console.error('[api/knowledge/courses/status] Error fetching experiences:', error)
		}

		const supabase = createSupabaseClient()

		// Extract video information from video_asset
		let finalVideoId = videoId
		let finalPlaybackId = playbackId
		let finalSignedToken = signedVideoPlaybackToken
		const finalEmbedId = embed_id || null
		const finalEmbedType = embed_type || null
		let videoSourceType: 'mux' | 'youtube' | 'loom' | null = video_source_type || null
		
		if (video_asset) {
			finalVideoId = video_asset.asset_id || finalVideoId || video_asset.id || null
			
			if (video_asset.playback_id) {
				finalPlaybackId = video_asset.playback_id
			} else if (video_asset.signed_playback_id) {
				const signedPlaybackId = video_asset.signed_playback_id
				const urlMatch = signedPlaybackId.match(/stream\.mux\.com\/([^?\/]+)/)
				if (urlMatch) {
					finalPlaybackId = urlMatch[1]
				} else {
					finalPlaybackId = signedPlaybackId
				}
			}
			
			if (video_asset.signed_video_playback_token) {
				finalSignedToken = video_asset.signed_video_playback_token
			} else if (video_asset.signedVideoPlaybackToken) {
				finalSignedToken = video_asset.signedVideoPlaybackToken
			} else if (video_asset.signed_token) {
				finalSignedToken = video_asset.signed_token
			}
		}
		
		if (!videoSourceType) {
			if (finalPlaybackId || video_asset?.playback_id) {
				videoSourceType = 'mux'
			} else if (finalEmbedType === 'youtube' || finalEmbedType === 'loom') {
				videoSourceType = finalEmbedType
			} else if (video_asset) {
				videoSourceType = 'mux'
			}
		}
		
		if (!videoSourceType && status === 'pending') {
			return Response.json(
				{ error: 'Missing video_source_type. Unable to determine video source type.' },
				{ status: 400 },
			)
		}
		
		if (videoSourceType === 'mux' && !finalPlaybackId) {
			const videoStatus = video_asset?.status
			if (videoStatus && videoStatus !== 'ready') {
				return Response.json(
					{ 
						error: `Video is still processing (status: ${videoStatus}). playback_id will be available when the video is ready.`,
						video_status: videoStatus,
					},
					{ status: 400 },
				)
			}
			
			return Response.json(
				{ error: 'Missing playback_id. The video_asset must contain a playback_id field.' },
				{ status: 400 },
			)
		}
		
		if (videoSourceType === 'mux' && !finalSignedToken) {
			return Response.json(
				{ error: 'Missing signed_video_playback_token. The video_asset must contain a signed_video_playback_token field.' },
				{ status: 400 },
			)
		}

		// Generate lesson URL
		let lessonUrl: string | null = null
		if (companySlug && coursesExperienceId && courseId && lessonId) {
			lessonUrl = `https://whop.com/joined/${companySlug}/lessons-${coursesExperienceId}/app/courses/${courseId}/lessons/${lessonId}/`
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
		}

		if (status === 'trained') {
			updateData.trained_at = new Date().toISOString()
		}

		const { data, error } = await supabase
			.from('courses')
			.upsert(updateData, {
				onConflict: 'whop_company_id,lesson_id',
			})
			.select()
			.single()

		if (error) {
			console.error('[api/knowledge/courses/status] Database error:', error)
			return Response.json(
				{ error: 'Failed to update training status', details: error.message },
				{ status: 500 },
			)
		}

		return Response.json({ success: true, data })
	} catch (error) {
		console.error('[api/knowledge/courses/status] Error:', error)
		return Response.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		)
	}
}

