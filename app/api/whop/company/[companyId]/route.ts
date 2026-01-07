import { NextRequest, NextResponse } from 'next/server'
import { getWhopCompany } from '@/lib/whop/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params
    console.log('[API Route] Fetching Whop company for ID:', companyId)

    if (!companyId) {
      console.error('[API Route] Company ID is missing')
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    console.log('[API Route] Calling getWhopCompany...')
    const company = await getWhopCompany(companyId)
    console.log('[API Route] getWhopCompany result:', company ? 'Success' : 'Null/Error')

    if (!company) {
      console.warn('[API Route] Company not found for ID:', companyId)
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    console.log('[API Route] Returning company data:', { id: company.id, title: company.title })
    return NextResponse.json(company)
  } catch (error: any) {
    console.error('[API Route] Error fetching Whop company:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

