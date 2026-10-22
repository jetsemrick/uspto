/**
 * Generate synthetic patent applications with seeded defects
 */

import type { ParsedApplication } from "./deterministic-checks";
import type { GroundTruth, DefectType } from "@/lib/types/readiness";

export interface SyntheticApplicationOptions {
  technologyArea: string;
  includeDefects?: DefectType[];
  isClean?: boolean;
}

const TECHNOLOGY_AREAS = [
  "Computer Science - Machine Learning",
  "Electrical Engineering - Power Systems",
  "Mechanical Engineering - Thermal Management",
  "Biotechnology - Gene Editing",
  "Chemical Engineering - Catalysis",
  "Medical Devices - Diagnostic Imaging",
  "Telecommunications - 5G Networks",
  "Renewable Energy - Solar Cells",
];

const CLEAN_ABSTRACT = `A method for optimizing thermal management in electronic devices is provided. The method comprises monitoring temperature distribution across multiple sensors, analyzing thermal patterns using machine learning algorithms, and dynamically adjusting cooling parameters. The system enables improved device performance and longevity through intelligent thermal regulation. Applications include smartphones and data center cooling.`;

/**
 * Generate a clean patent application (no defects)
 */
export function generateCleanApplication(
  id: string,
  technologyArea: string,
): ParsedApplication {
  return {
    applicationId: id,
    abstract: CLEAN_ABSTRACT,
    claims: [
      {
        number: 1,
        text: "A thermal management system comprising a sensor array configured to detect temperature variations, a processor coupled to the sensor array, and a cooling mechanism controlled by the processor.",
        lineNumber: 100,
      },
      {
        number: 2,
        text: "The thermal management system of claim 1, wherein the sensor array comprises a plurality of thermocouples.",
        lineNumber: 110,
      },
      {
        number: 3,
        text: "The thermal management system of claim 1, wherein the processor is configured to execute a machine learning algorithm.",
        lineNumber: 120,
      },
    ],
    paragraphs: [
      {
        number: "[0001]",
        text: "This invention relates to thermal management systems for electronic devices.",
        lineNumber: 10,
      },
      {
        number: "[0002]",
        text: "Electronic devices generate heat during operation. The sensor array 10 includes multiple temperature sensors 12, 14, and 16. The processor 20 analyzes data from the sensor array 10.",
        lineNumber: 15,
      },
      {
        number: "[0003]",
        text: "The cooling mechanism 30 includes a fan 32 and heat sink 34. The system provides efficient thermal regulation.",
        lineNumber: 20,
      },
    ],
    figures: ["1", "2", "3"],
    drawingReferences: ["10", "12", "14", "16", "20", "30", "32", "34"],
    pages: [1, 2, 3, 4, 5],
  };
}

/**
 * Seed a specific defect into an application
 */
function seedDefect(
  app: ParsedApplication,
  defectType: DefectType,
): ParsedApplication {
  const modified = JSON.parse(JSON.stringify(app)) as ParsedApplication;

  switch (defectType) {
    case "abstract_length":
      // Make abstract too long
      modified.abstract =
        CLEAN_ABSTRACT +
        " " +
        "Additional detailed technical information about the thermal management system including various implementation details and specific configurations for different device types and operating conditions in various environmental scenarios and use cases for improved performance and efficiency metrics across different device categories and thermal load conditions with adaptive algorithms that respond to changing thermal characteristics during device operation and deployment in various settings from consumer electronics to industrial applications with consideration for energy efficiency and environmental sustainability goals." +
        " " +
        "Further elaboration on the innovative aspects of the thermal control methodology and its advantages over conventional approaches in the field of electronic device cooling and temperature regulation.";
      break;

    case "claim_numbering":
      // Skip claim 2 (jump from 1 to 3)
      if (modified.claims.length >= 3) {
        modified.claims[1].number = 3;
        modified.claims[2].number = 4;
      }
      break;

    case "claim_form":
      // Make first claim not start with capital
      if (modified.claims.length > 0) {
        modified.claims[0].text =
          "a thermal management system comprising a sensor array configured to detect temperature variations, a processor coupled to the sensor array, and a cooling mechanism controlled by the processor";
      }
      break;

    case "drawing_reference":
      // Add a reference in description that's not in drawings
      if (modified.paragraphs.length > 0) {
        modified.paragraphs[0].text +=
          " The additional component 99 provides enhanced functionality.";
      }
      break;

    case "page_numbering":
      // Skip page 3
      if (modified.pages.length >= 4) {
        modified.pages[2] = 4;
        modified.pages[3] = 5;
      }
      break;

    case "antecedent_basis":
      // Add a claim with antecedent basis issue
      modified.claims.push({
        number: modified.claims.length + 1,
        text: "The thermal management system of claim 1, wherein the control unit processes the temperature data and adjusts the cooling parameters accordingly.",
        lineNumber: 130,
      });
      break;
  }

  return modified;
}

/**
 * Generate a synthetic application with specified defects
 */
export function generateSyntheticApplication(
  id: string,
  options: SyntheticApplicationOptions,
): { app: ParsedApplication; groundTruth: GroundTruth } {
  let app = generateCleanApplication(id, options.technologyArea);

  const seededDefects: GroundTruth["seededDefects"] = [];

  if (!options.isClean && options.includeDefects) {
    options.includeDefects.forEach((defectType) => {
      app = seedDefect(app, defectType);

      seededDefects.push({
        type: defectType,
        location: getDefectLocation(defectType, app),
        description: getDefectDescription(defectType),
      });
    });
  }

  const groundTruth: GroundTruth = {
    applicationId: id,
    technologyArea: options.technologyArea,
    seededDefects,
    isClean: options.isClean || false,
  };

  return { app, groundTruth };
}

function getDefectLocation(
  defectType: DefectType,
  app: ParsedApplication,
): GroundTruth["seededDefects"][0]["location"] {
  switch (defectType) {
    case "abstract_length":
      return { type: "abstract", identifier: "abstract" };
    case "claim_numbering":
      return { type: "claim", identifier: "claim 2" };
    case "claim_form":
      return { type: "claim", identifier: "claim 1", lineNumber: 100 };
    case "drawing_reference":
      return { type: "paragraph", identifier: "reference 99" };
    case "page_numbering":
      return { type: "page", identifier: "page 3" };
    case "antecedent_basis":
      return {
        type: "claim",
        identifier: `claim ${app.claims.length}`,
        lineNumber: 130,
      };
  }
}

function getDefectDescription(defectType: DefectType): string {
  switch (defectType) {
    case "abstract_length":
      return "Abstract exceeds 150 words";
    case "claim_numbering":
      return "Claims not numbered consecutively";
    case "claim_form":
      return "Claim does not start with capital letter";
    case "drawing_reference":
      return "Reference character in description not in drawings";
    case "page_numbering":
      return "Pages not numbered consecutively";
    case "antecedent_basis":
      return "Term lacks proper antecedent basis";
  }
}

/**
 * Generate a complete test suite of synthetic applications
 */
export function generateTestSuite(): Array<{
  app: ParsedApplication;
  groundTruth: GroundTruth;
}> {
  const suite: Array<{ app: ParsedApplication; groundTruth: GroundTruth }> = [];

  // Generate 10 clean applications (controls)
  for (let i = 0; i < 10; i++) {
    const techArea =
      TECHNOLOGY_AREAS[i % TECHNOLOGY_AREAS.length];
    suite.push(
      generateSyntheticApplication(`app-clean-${i + 1}`, {
        technologyArea: techArea,
        isClean: true,
      }),
    );
  }

  // Generate applications with single defect types (5 per type)
  const defectTypes: DefectType[] = [
    "abstract_length",
    "claim_numbering",
    "claim_form",
    "drawing_reference",
    "page_numbering",
    "antecedent_basis",
  ];

  defectTypes.forEach((defectType, typeIndex) => {
    for (let i = 0; i < 5; i++) {
      const techArea =
        TECHNOLOGY_AREAS[(typeIndex * 5 + i) % TECHNOLOGY_AREAS.length];
      suite.push(
        generateSyntheticApplication(
          `app-${defectType}-${i + 1}`,
          {
            technologyArea: techArea,
            includeDefects: [defectType],
          },
        ),
      );
    }
  });

  // Generate applications with multiple defects (10 applications)
  for (let i = 0; i < 10; i++) {
    const techArea = TECHNOLOGY_AREAS[i % TECHNOLOGY_AREAS.length];
    const numDefects = 2 + (i % 3); // 2-4 defects
    const selectedDefects = defectTypes.slice(0, numDefects);

    suite.push(
      generateSyntheticApplication(
        `app-multi-${i + 1}`,
        {
          technologyArea: techArea,
          includeDefects: selectedDefects,
        },
      ),
    );
  }

  return suite;
}

/**
 * Get a specific synthetic application by ID
 */
export function getSyntheticApplication(
  applicationId: string,
): { app: ParsedApplication; groundTruth: GroundTruth } | null {
  const suite = generateTestSuite();
  return suite.find((item) => item.app.applicationId === applicationId) || null;
}

/**
 * List all synthetic application IDs
 */
export function listSyntheticApplications(): string[] {
  return generateTestSuite().map((item) => item.app.applicationId);
}
