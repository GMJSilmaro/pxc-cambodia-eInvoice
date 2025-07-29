import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvCoreService } from '@/lib/caminv/core-service';

export async function POST(request: NextRequest) {
  try {
    // Get current user and team
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const body = await request.json();
    const { endpointId, merchantId } = body;

    if (!endpointId) {
      return NextResponse.json({ error: 'Endpoint ID is required' }, { status: 400 });
    }

    // Validate endpoint ID format (basic validation)
    if (!/^KHUID\d{8}$/.test(endpointId)) {
      return NextResponse.json({ 
        error: 'Invalid Endpoint ID format. Expected format: KHUID followed by 8 digits' 
      }, { status: 400 });
    }

    try {
      // Check if customer is registered with CamInv
      // This would typically call a CamInv API endpoint to verify customer registration
      // For now, we'll simulate the check based on the endpoint ID pattern
      
      const customerProfile = await checkCustomerProfile(endpointId, merchantId);
      
      return NextResponse.json({
        success: true,
        profile: customerProfile,
      });
    } catch (error) {
      console.error('Customer profile check failed:', error);
      
      // Return a not found profile for invalid/unregistered customers
      const notFoundProfile = {
        endpoint_id: endpointId,
        company_name_en: 'Unknown Company',
        company_name_kh: null,
        entity_type: 'UNKNOWN',
        entity_id: 'N/A',
        tin: 'N/A',
        country: 'KH',
        city: null,
        phone_number: null,
        email: null,
        business_type: null,
        is_registered: false,
      };

      return NextResponse.json({
        success: true,
        profile: notFoundProfile,
      });
    }
  } catch (error) {
    console.error('Customer profile check error:', error);
    return NextResponse.json(
      { error: 'Failed to check customer profile' },
      { status: 500 }
    );
  }
}

async function checkCustomerProfile(endpointId: string, merchantId?: number) {
  // This is a mock implementation. In a real scenario, you would:
  // 1. Call CamInv API to check if the customer is registered
  // 2. Retrieve customer business information if available
  // 3. Return the profile data
  
  // For demonstration, we'll simulate different scenarios based on the endpoint ID
  const lastDigit = parseInt(endpointId.slice(-1));
  
  if (lastDigit % 3 === 0) {
    // Simulate registered customer
    return {
      endpoint_id: endpointId,
      company_name_en: "Sample Company Ltd",
      company_name_kh: "ក្រុមហ៊ុន គំរូ",
      entity_type: "PRIVATE_SECTOR",
      entity_id: endpointId.replace('KHUID', ''),
      tin: `K001-${endpointId.slice(-7)}`,
      country: "KH",
      city: "Phnom Penh",
      phone_number: "+855 12 345 678",
      email: "contact@samplecompany.com",
      business_type: "TRADING",
      is_registered: true,
    };
  } else if (lastDigit % 2 === 0) {
    // Simulate partially registered customer (missing some info)
    return {
      endpoint_id: endpointId,
      company_name_en: "Partial Info Company",
      company_name_kh: null,
      entity_type: "PRIVATE_SECTOR",
      entity_id: endpointId.replace('KHUID', ''),
      tin: `K002-${endpointId.slice(-7)}`,
      country: "KH",
      city: null,
      phone_number: null,
      email: null,
      business_type: "SERVICES",
      is_registered: true,
    };
  } else {
    // Simulate unregistered customer
    throw new Error('Customer not found in CamInv registry');
  }
}

// Alternative implementation using actual CamInv API (commented out for now)
/*
async function checkCustomerProfileWithAPI(endpointId: string, merchantId?: number) {
  try {
    if (!merchantId) {
      throw new Error('Merchant ID required for API calls');
    }

    // Get member info or search for customer using CamInv API
    const result = await camInvCoreService.getMemberInfo(merchantId);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to access CamInv API');
    }

    // This would be the actual API call to check customer registration
    // const customerResult = await camInvApiClient.checkCustomerRegistration(accessToken, endpointId);
    
    // For now, return mock data
    return {
      endpoint_id: endpointId,
      company_name_en: "API Retrieved Company",
      company_name_kh: "ក្រុមហ៊ុន API",
      entity_type: "PRIVATE_SECTOR",
      entity_id: endpointId.replace('KHUID', ''),
      tin: `K003-${endpointId.slice(-7)}`,
      country: "KH",
      city: "Phnom Penh",
      phone_number: "+855 12 345 678",
      email: "api@company.com",
      business_type: "MANUFACTURING",
      is_registered: true,
    };
  } catch (error) {
    console.error('API customer check failed:', error);
    throw error;
  }
}
*/
