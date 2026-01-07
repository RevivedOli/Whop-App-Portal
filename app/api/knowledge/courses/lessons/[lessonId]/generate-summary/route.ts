import { headers } from 'next/headers'
import { verifyUserToken } from '@/lib/whop-api'
import { createSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/knowledge/courses/lessons/[lessonId]/generate-summary
 * 
 * Generates a PDF summary for a trained lesson by calling the Supabase Edge Function.
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ lessonId: string }> }
): Promise<Response> {
	console.log('[api/knowledge/courses/lessons/[lessonId]/generate-summary] Request received')

	try {
		const { lessonId } = await params
		const requestHeaders = await headers()
		
		if (!lessonId) {
			return Response.json(
				{ error: 'Lesson ID is required' },
				{ status: 400 },
			)
		}
		
		// Authenticate user
		const tokenData = await verifyUserToken(requestHeaders, request.url)
		if (!tokenData) {
			console.error('[api/knowledge/courses/lessons/[lessonId]/generate-summary] Authentication failed')
			return Response.json(
				{ error: 'Unauthorized' },
				{ status: 401 },
			)
		}

		const body = await request.json()
		const { companyId } = body

		if (!companyId) {
			return Response.json(
				{ error: 'Company ID is required' },
				{ status: 400 },
			)
		}

		const supabase = createSupabaseClient()

		// Verify lesson exists and is trained
		const { data: courseRow, error: courseError } = await supabase
			.from('courses')
			.select('status, lesson_summary_pdf')
			.eq('lesson_id', lessonId)
			.eq('whop_company_id', companyId)
			.single()

		if (courseError || !courseRow) {
			return Response.json(
				{ error: 'Lesson not found' },
				{ status: 404 },
			)
		}

		if (courseRow.status !== 'trained') {
			return Response.json(
				{ error: 'Lesson must be trained before generating summary' },
				{ status: 400 },
			)
		}

		if (courseRow.lesson_summary_pdf) {
			return Response.json(
				{ error: 'Summary already exists for this lesson' },
				{ status: 400 },
			)
		}

		// Call Supabase Edge Function
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
		const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

		if (!supabaseUrl || !supabaseAnonKey) {
			return Response.json(
				{ error: 'Supabase configuration missing' },
				{ status: 500 },
			)
		}

		const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-lesson-summary`

		const edgeFunctionResponse = await fetch(edgeFunctionUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${supabaseAnonKey}`,
			},
			body: JSON.stringify({
				lesson_id: lessonId,
				company_id: companyId,
			}),
		})

		if (!edgeFunctionResponse.ok) {
			const errorData = await edgeFunctionResponse.json().catch(() => ({}))
			console.error('[api/knowledge/courses/lessons/[lessonId]/generate-summary] Edge function error:', errorData)
			return Response.json(
				{ 
					error: errorData.error || 'Failed to generate summary',
					details: errorData.details,
				},
				{ status: edgeFunctionResponse.status },
			)
		}

		const result = await edgeFunctionResponse.json()

		return Response.json({
			success: true,
			lesson_summary_pdf: result.lesson_summary_pdf,
		})
	} catch (error: any) {
		console.error('[api/knowledge/courses/lessons/[lessonId]/generate-summary] Error:', error)
		
		const errorMessage = error?.message || 'Failed to generate summary'
		
		return Response.json(
			{ error: errorMessage },
			{ status: error?.response?.status || 500 },
		)
	}
}

