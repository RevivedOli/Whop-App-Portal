import { headers } from 'next/headers'
import { verifyUserToken } from '@/lib/whop-api'
import { createSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/knowledge/courses/lessons/[lessonId]/update
 * 
 * Updates the metadata for a trained lesson.
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ lessonId: string }> }
): Promise<Response> {
	console.log('[api/knowledge/courses/lessons/[lessonId]/update] Request received')

	try {
		const { lessonId } = await params
		const requestHeaders = await headers()
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url)
		if (!tokenData) {
			console.error('[api/knowledge/courses/lessons/[lessonId]/update] Authentication failed')
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 },
			)
		}

		const body = await request.json()
		const {
			companyId: companyIdFromBody,
			courseId,
			chapterId,
			metadata,
		} = body

		const companyId = companyIdFromBody || tokenData.companyId

		if (!companyId || !courseId || !lessonId || !metadata) {
			return Response.json(
				{ error: 'Missing required fields: companyId, courseId, lessonId, metadata' },
				{ status: 400 },
			)
		}

		if (typeof metadata !== 'object' || Array.isArray(metadata)) {
			return Response.json(
				{ error: 'Metadata must be an object' },
				{ status: 400 },
			)
		}

		const supabase = createSupabaseClient()

		// Check if the lesson exists and is trained
		const { data: existingLesson, error: fetchError } = await supabase
			.from('courses')
			.select('*')
			.eq('whop_company_id', companyId)
			.eq('lesson_id', lessonId)
			.single()

		if (fetchError) {
			console.error('[api/knowledge/courses/lessons/[lessonId]/update] Error fetching lesson:', fetchError)
			return Response.json(
				{ error: 'Lesson not found', details: fetchError.message },
				{ status: 404 },
			)
		}

		if (existingLesson.status !== 'trained') {
			return Response.json(
				{ error: 'Only trained lessons can be updated' },
				{ status: 400 },
			)
		}

		// Update the metadata
		const { data, error } = await supabase
			.from('courses')
			.update({
				metadata: metadata,
				updated_at: new Date().toISOString(),
			})
			.eq('whop_company_id', companyId)
			.eq('lesson_id', lessonId)
			.select()
			.single()

		if (error) {
			console.error('[api/knowledge/courses/lessons/[lessonId]/update] Database error:', error)
			return Response.json(
				{ error: 'Failed to update lesson metadata', details: error.message },
				{ status: 500 },
			)
		}

		return Response.json({ success: true, data })
	} catch (error) {
		console.error('[api/knowledge/courses/lessons/[lessonId]/update] Error:', error)
		return Response.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		)
	}
}

