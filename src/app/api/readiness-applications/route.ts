/**
 * API route to list available synthetic applications
 * GET /api/readiness-applications
 */

import { listSyntheticApplications, generateTestSuite } from "@/lib/readiness/synthetic-data";

export async function GET() {
  try {
    const applicationIds = listSyntheticApplications();
    const testSuite = generateTestSuite();

    const applications = testSuite.map((item) => ({
      applicationId: item.app.applicationId,
      technologyArea: item.groundTruth.technologyArea,
      isClean: item.groundTruth.isClean,
      defectCount: item.groundTruth.seededDefects.length,
      defectTypes: item.groundTruth.seededDefects.map((d) => d.type),
    }));

    return Response.json({
      total: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Error listing applications:", error);
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
