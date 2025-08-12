import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AgentResponse } from '@/lib/agents/utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { query, department = 'housekeeping', date = new Date() } = await request.json();

    // Get operational data
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const [todayOccupancy, weeklyOccupancy, roomTypeDistribution] = await Promise.all([
      prisma.occupancyData.findFirst({
        where: {
          date: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),
      prisma.occupancyData.findMany({
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.occupancyData.groupBy({
        by: ['roomType'],
        where: {
          date: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        _sum: { sold: true }
      })
    ]);

    const insights = [];
    const actions = [];
    let confidence = 0.85;

    // Calculate staffing needs
    const currentOccupancy = todayOccupancy?.occupancyRate || 0.7;
    const roomsSold = todayOccupancy?.sold || 105; // 70% of 150 rooms
    
    // Housekeeping calculations (industry standard: 30 min per room)
    const housekeepingHours = (roomsSold * 0.5);
    const housekeepersNeeded = Math.ceil(housekeepingHours / 8); // 8-hour shifts

    insights.push(`${roomsSold} rooms occupied today requiring ${housekeepingHours} hours of housekeeping`);
    actions.push(`Schedule ${housekeepersNeeded} housekeepers for today`);

    // Peak periods analysis
    const peakDays = weeklyOccupancy.filter(d => d.occupancyRate > 0.8);
    if (peakDays.length > 0) {
      insights.push(`${peakDays.length} high occupancy days this week - prepare extra supplies`);
      actions.push('Order additional amenities and linens for peak periods');
    }

    // Room type specific needs
    const roomTypeNeeds = roomTypeDistribution.map(rt => ({
      type: rt.roomType,
      rooms: rt._sum.sold || 0,
      supplies: rt.roomType.includes('2BR') ? 'extra' : 'standard'
    }));

    roomTypeNeeds.forEach(rt => {
      if (rt.rooms > 0) {
        actions.push(`Prepare ${rt.supplies} supplies for ${rt.rooms} ${rt.type} units`);
      }
    });

    // Maintenance windows
    const lowOccupancyDay = weeklyOccupancy.reduce((lowest, current) => 
      current.occupancyRate < lowest.occupancyRate ? current : lowest
    );
    
    insights.push(`Best maintenance window: ${new Date(lowOccupancyDay.date).toLocaleDateString()} (${(lowOccupancyDay.occupancyRate * 100).toFixed(1)}% occupancy)`);

    const response: AgentResponse = {
      agent: 'operations',
      recommendation: `Staff ${housekeepersNeeded} housekeepers today for ${roomsSold} occupied rooms. Schedule maintenance for ${new Date(lowOccupancyDay.date).toLocaleDateString()}.`,
      confidence,
      data: {
        department,
        currentOccupancy: (currentOccupancy * 100).toFixed(1),
        roomsSold,
        housekeepingHours,
        housekeepersNeeded,
        maintenanceWindow: new Date(lowOccupancyDay.date).toLocaleDateString(),
        roomTypeBreakdown: roomTypeNeeds
      },
      dataPoints: weeklyOccupancy.length + roomTypeDistribution.length,
      insights,
      actions,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Operations agent error:', error);
    return NextResponse.json({
      error: 'Operations agent failed',
      message: error.message
    }, { status: 500 });
  }
}
