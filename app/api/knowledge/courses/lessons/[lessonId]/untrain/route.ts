import { headers } from 'next/headers'
import { verifyUserToken } from '@/lib/whop-api'
import { createSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/knowledge/courses/lessons/[lessonId]/untrain
 * 
 * Untrains a lesson by deleting it from the database.
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ lessonId: string }> }
): Promise<Response> {
	console.log('[api/knowledge/courses/lessons/[lessonId]/untrain] Request received')

	try {
		const { lessonId } = await params
		const requestHeaders = await headers()
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url)
		if (!tokenData) {
			console.error('[api/knowledge/courses/lessons/[lessonId]/untrain] Authentication failed')
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
		} = body

		const companyId = companyIdFromBody || tokenData.companyId

		if (!companyId || !courseId || !lessonId) {
			return Response.json(
				{ error: 'Missing required fields: companyId, courseId, lessonId' },
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
			console.error('[api/knowledge/courses/lessons/[lessonId]/untrain] Error fetching lesson:', fetchError)
			return Response.json(
				{ error: 'Lesson not found', details: fetchError.message },
				{ status: 404 },
			)
		}

		if (existingLesson.status !== 'trained') {
			return Response.json(
				{ error: 'Only trained lessons can be untrained' },
				{ status: 400 },
			)
		}

		// Delete files from Supabase Storage
		const filesToDelete: string[] = []

		if (existingLesson.transcription_file) {
			const transcriptionUrl = existingLesson.transcription_file
			const match1 = transcriptionUrl.match(/\/transcriptions\/([^/?]+)/)
			const match2 = transcriptionUrl.match(/storage\/v1\/object\/public\/transcriptions\/([^/?]+)/)
			const filePath = match1 ? match1[1] : (match2 ? match2[1] : `${companyId}/${lessonId}.vtt`)
			filesToDelete.push(filePath)
		}

		if (existingLesson.lesson_summary_pdf) {
			const pdfUrl = existingLesson.lesson_summary_pdf
			const match1 = pdfUrl.match(/\/transcriptions\/([^/?]+)/)
			const match2 = pdfUrl.match(/storage\/v1\/object\/public\/transcriptions\/([^/?]+)/)
			const filePath = match1 ? match1[1] : (match2 ? match2[1] : `${companyId}/${lessonId}-summary.pdf`)
			filesToDelete.push(filePath)
		}

		if (filesToDelete.length > 0) {
			const { error: storageError } = await supabase.storage
				.from('transcriptions')
				.remove(filesToDelete)

			if (storageError) {
				console.error('[api/knowledge/courses/lessons/[lessonId]/untrain] Error deleting files:', storageError)
				return Response.json(
					{ 
						error: 'Failed to delete files from storage',
						details: storageError.message,
					},
					{ status: 500 },
				)
			}
		}

		// Delete the lesson record
		const { error: deleteError } = await supabase
			.from('courses')
			.delete()
			.eq('whop_company_id', companyId)
			.eq('lesson_id', lessonId)

		if (deleteError) {
			console.error('[api/knowledge/courses/lessons/[lessonId]/untrain] Database error:', deleteError)
			return Response.json(
				{ error: 'Failed to delete lesson', details: deleteError.message },
				{ status: 500 },
			)
		}

		return Response.json({ success: true, message: 'Lesson untrained and deleted successfully' })
	} catch (error) {
		console.error('[api/knowledge/courses/lessons/[lessonId]/untrain] Error:', error)
		return Response.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 },
		)
	}
}

