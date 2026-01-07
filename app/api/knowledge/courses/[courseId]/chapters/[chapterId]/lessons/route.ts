import { headers } from 'next/headers'
import { verifyUserToken } from '@/lib/whop-api'

/**
 * GET /api/knowledge/courses/[courseId]/chapters/[chapterId]/lessons
 * 
 * Fetches detailed lesson information for a specific chapter.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ courseId: string; chapterId: string }> }
): Promise<Response> {
	console.log('[api/knowledge/courses/[courseId]/chapters/[chapterId]/lessons] Request received')

	try {
		const { courseId, chapterId } = await params
		const requestHeaders = await headers()
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url)
		if (!tokenData) {
			console.error('[api/knowledge/courses/[courseId]/chapters/[chapterId]/lessons] Authentication failed')
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 },
			)
		}

		// Use list_course_lessons with chapter_id to get lessons for this chapter
		const lessonsResponse = await tokenData.whop.courseLessons.list({
			chapter_id: chapterId,
		})

		if (!lessonsResponse || !lessonsResponse.data) {
			return Response.json(
				{ error: 'No lessons found for this chapter' },
				{ status: 404 },
			)
		}

		// Fetch detailed lesson information for each lesson
		const lessonsWithDetails = await Promise.all(
			lessonsResponse.data.map(async (lesson) => {
				try {
					const lessonDetail = await tokenData.whop.courseLessons.retrieve(lesson.id)
					
					// Construct thumbnail URL
					let thumbnailUrl = null
					if ((lessonDetail as any).video_asset?.playback_id) {
						thumbnailUrl = `https://image.mux.com/${(lessonDetail as any).video_asset.playback_id}/thumbnail.webp`
					} else if ((lessonDetail as any).thumbnail?.url) {
						thumbnailUrl = (lessonDetail as any).thumbnail.url
					}
					
					const videoAsset = (lessonDetail as any).video_asset || null
					
					const embedId = (lessonDetail as any).embed_id || 
						(lessonDetail as any).embed?.id || 
						(lessonDetail as any).embedId || 
						null
					const embedType = (lessonDetail as any).embed_type || 
						(lessonDetail as any).embed?.type || 
						(lessonDetail as any).embedType || 
						null
					
					// Include signed token if available
					if (videoAsset) {
						videoAsset.signed_video_playback_token = 
							videoAsset.signed_video_playback_token ||
							videoAsset.signedVideoPlaybackToken ||
							(lessonDetail as any).signed_video_playback_token ||
							(lessonDetail as any).signedVideoPlaybackToken ||
							null
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
					}
				} catch (error) {
					console.error(`[api/knowledge/courses/[courseId]/chapters/[chapterId]/lessons] Error fetching lesson detail ${lesson.id}:`, error)
					const embedIdFromList = (lesson as any).embed_id || null
					const embedTypeFromList = (lesson as any).embed_type || null
					
					return {
						id: lesson.id,
						title: lesson.title,
						order: lesson.order,
						lesson_type: lesson.lesson_type,
						thumbnail: (lesson as any).thumbnail || null,
						video_asset: null,
						embed_id: embedIdFromList,
						embed_type: embedTypeFromList as 'youtube' | 'loom' | undefined,
					}
				}
			})
		)

		return Response.json({ lessons: lessonsWithDetails })
	} catch (error) {
		console.error('[api/knowledge/courses/[courseId]/chapters/[chapterId]/lessons] Error:', error)
		return Response.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		)
	}
}

