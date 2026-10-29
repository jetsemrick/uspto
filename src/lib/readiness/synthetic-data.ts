/**
 * Generate synthetic patent applications with seeded defects
 */

import type { ParsedApplication } from "./deterministic-checks";
import type { GroundTruth, DefectType } from "@/lib/types/readiness";

export interface SyntheticApplicationOptions {
  technologyArea: string;
  includeDefects?: DefectType[];
  isClean?: boolean;
  includeSequenceListing?: boolean;
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
  includeSequenceListing = false,
): ParsedApplication {
  const baseApp: ParsedApplication = {
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

  if (includeSequenceListing) {
    // Add biotechnology-specific content with sequence listing
    baseApp.abstract = `An isolated nucleic acid molecule encoding a novel thermostable enzyme is provided. The enzyme exhibits enhanced catalytic activity at elevated temperatures. The nucleic acid sequence is set forth in SEQ ID NO:1. Methods for using the enzyme in industrial processes are disclosed. Applications include biofuel production and pharmaceutical synthesis.`;
    
    baseApp.claims = [
      {
        number: 1,
        text: "An isolated nucleic acid molecule comprising a nucleotide sequence encoding a thermostable enzyme, wherein the nucleotide sequence is at least 95% identical to SEQ ID NO:1.",
        lineNumber: 100,
      },
      {
        number: 2,
        text: "The isolated nucleic acid molecule of claim 1, wherein the nucleotide sequence is SEQ ID NO:1.",
        lineNumber: 110,
      },
      {
        number: 3,
        text: "A recombinant vector comprising the isolated nucleic acid molecule of claim 1.",
        lineNumber: 120,
      },
      {
        number: 4,
        text: "A host cell comprising the recombinant vector of claim 3.",
        lineNumber: 130,
      },
    ];

    baseApp.paragraphs = [
      {
        number: "[0001]",
        text: "This invention relates to thermostable enzymes for industrial applications.",
        lineNumber: 10,
      },
      {
        number: "[0002]",
        text: "The nucleic acid sequence encoding the thermostable enzyme is provided as SEQ ID NO:1 in the sequence listing. The amino acid sequence of the enzyme is provided as SEQ ID NO:2.",
        lineNumber: 15,
      },
      {
        number: "[0003]",
        text: "SEQ ID NO:1 is a 1,500 nucleotide sequence encoding the thermostable enzyme. SEQ ID NO:2 is the corresponding 500 amino acid protein sequence.",
        lineNumber: 20,
      },
      {
        number: "[0004]",
        text: "The enzyme exhibits optimal activity at 85°C and maintains 70% activity after 24 hours at this temperature.",
        lineNumber: 25,
      },
    ];

    baseApp.pages = [1, 2, 3, 4, 5, 6]; // Extra page for sequence listing
    if (includeSequenceListing) {
      // Don't check drawing references for sequence listing applications
      baseApp.drawingReferences = [];
    }
  }

  return baseApp;
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

    case "means_plus_function":
      // Add a claim with means-plus-function language
      modified.claims.push({
        number: modified.claims.length + 1,
        text: "The thermal management system of claim 1, further comprising means for regulating thermal output based on detected temperature variations.",
        lineNumber: 140,
      });
      break;

    case "relative_term":
      // Add a claim with relative term
      modified.claims.push({
        number: modified.claims.length + 1,
        text: "The thermal management system of claim 1, wherein the sensor array operates at high speed.",
        lineNumber: 150,
      });
      break;

    case "indefinite_term":
      // Add a claim with indefinite term
      modified.claims.push({
        number: modified.claims.length + 1,
        text: "The thermal management system of claim 1, wherein the cooling mechanism includes suitable cooling elements.",
        lineNumber: 160,
      });
      break;

    case "multiple_dependency":
      // Add an improper multiple dependency
      if (modified.claims.length >= 3) {
        modified.claims.push({
          number: modified.claims.length + 1,
          text: "The thermal management system of claims 1 or 2, wherein the processor executes real-time thermal analysis.",
          lineNumber: 170,
        });
      }
      break;

    case "claim_support_gap":
      // Add a claim element not supported in spec
      modified.claims.push({
        number: modified.claims.length + 1,
        text: "The thermal management system of claim 1, further comprising a wireless communication module configured to transmit thermal data.",
        lineNumber: 180,
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
  let app = generateCleanApplication(
    id,
    options.technologyArea,
    options.includeSequenceListing,
  );

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
    case "means_plus_function":
      return {
        type: "claim",
        identifier: `claim ${app.claims.length}`,
        lineNumber: 140,
      };
    case "relative_term":
      return {
        type: "claim",
        identifier: `claim ${app.claims.length}`,
        lineNumber: 150,
      };
    case "indefinite_term":
      return {
        type: "claim",
        identifier: `claim ${app.claims.length}`,
        lineNumber: 160,
      };
    case "multiple_dependency":
      return {
        type: "claim",
        identifier: `claim ${app.claims.length}`,
        lineNumber: 170,
      };
    case "claim_support_gap":
      return {
        type: "claim",
        identifier: `claim ${app.claims.length}`,
        lineNumber: 180,
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
    case "means_plus_function":
      return "Means-plus-function language without structural recitation";
    case "relative_term":
      return "Relative term without objective standard";
    case "indefinite_term":
      return "Indefinite term lacking clear scope";
    case "multiple_dependency":
      return "Improper multiple dependent claim (alternative format)";
    case "claim_support_gap":
      return "Claim element not supported in specification";
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

  // Generate 10 clean applications (controls), including one with sequence listing
  for (let i = 0; i < 10; i++) {
    const techArea =
      TECHNOLOGY_AREAS[i % TECHNOLOGY_AREAS.length];
    suite.push(
      generateSyntheticApplication(`app-clean-${i + 1}`, {
        technologyArea: techArea,
        isClean: true,
        includeSequenceListing: i === 3, // app-clean-4 has sequence listing
      }),
    );
  }

  // Generate applications with single defect types (3 per type for 11 types = 33)
  const defectTypes: DefectType[] = [
    "abstract_length",
    "claim_numbering",
    "claim_form",
    "drawing_reference",
    "page_numbering",
    "antecedent_basis",
    "means_plus_function",
    "relative_term",
    "indefinite_term",
    "multiple_dependency",
    "claim_support_gap",
  ];

  defectTypes.forEach((defectType, typeIndex) => {
    for (let i = 0; i < 3; i++) {
      const techArea =
        TECHNOLOGY_AREAS[(typeIndex * 3 + i) % TECHNOLOGY_AREAS.length];
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
