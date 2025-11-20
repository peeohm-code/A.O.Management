import NodeClam from "clamscan";

/**
 * Virus Scanner using ClamAV
 * 
 * This module provides virus scanning functionality for uploaded files
 * Note: ClamAV daemon must be installed and running on the server
 */

let clamScanInstance: NodeClam | null = null;
let isInitialized = false;
let initializationError: Error | null = null;

// Initialize ClamAV scanner
async function initClamScan(): Promise<NodeClam | null> {
  if (clamScanInstance) {
    return clamScanInstance;
  }

  if (initializationError) {
    console.warn("[VirusScanner] Previous initialization failed:", initializationError.message);
    return null;
  }

  try {
    // Try to initialize ClamAV
    const clamscan = await new NodeClam().init({
      removeInfected: false, // Don't auto-remove, let application handle it
      quarantineInfected: false,
      scanLog: null,
      debugMode: process.env.NODE_ENV === "development",
      clamdscan: {
        socket: "/var/run/clamav/clamd.ctl", // Default ClamAV socket
        host: "127.0.0.1",
        port: 3310,
        timeout: 60000,
        localFallback: true, // Fallback to local scanning if daemon unavailable
      },
      preference: "clamdscan", // Prefer daemon for better performance
    });

    clamScanInstance = clamscan;
    isInitialized = true;
    console.log("[VirusScanner] ClamAV initialized successfully");
    return clamscan;
  } catch (error) {
    initializationError = error as Error;
    console.warn("[VirusScanner] ClamAV not available:", (error as Error).message);
    console.warn("[VirusScanner] File uploads will proceed without virus scanning");
    return null;
  }
}

/**
 * Scan a file for viruses
 * @param filePath - Path to the file to scan
 * @returns Object with isInfected flag and optional virus name
 */
export async function scanFile(
  filePath: string
): Promise<{ isInfected: boolean; virus?: string; error?: string }> {
  try {
    const scanner = await initClamScan();

    // If ClamAV is not available, allow file upload (with warning logged)
    if (!scanner) {
      console.warn("[VirusScanner] Skipping virus scan - ClamAV not available");
      return { isInfected: false };
    }

    // Scan the file
    const { isInfected, viruses } = await scanner.isInfected(filePath);

    if (isInfected && viruses && viruses.length > 0) {
      console.warn(`[VirusScanner] Infected file detected: ${filePath}`, viruses);
      return {
        isInfected: true,
        virus: viruses.join(", "),
      };
    }

    return { isInfected: false };
  } catch (error) {
    console.error("[VirusScanner] Error scanning file:", error);
    // On error, we allow the upload but log the error
    // This prevents service disruption if ClamAV has issues
    return {
      isInfected: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Scan file buffer for viruses
 * @param buffer - File buffer to scan
 * @param filename - Original filename for logging
 * @returns Object with isInfected flag and optional virus name
 */
export async function scanBuffer(
  buffer: Buffer,
  filename: string
): Promise<{ isInfected: boolean; virus?: string; error?: string }> {
  try {
    const scanner = await initClamScan();

    if (!scanner) {
      console.warn("[VirusScanner] Skipping virus scan - ClamAV not available");
      return { isInfected: false };
    }

    // Scan the buffer
    const { isInfected, viruses } = await scanner.scanStream(buffer);

    if (isInfected && viruses && viruses.length > 0) {
      console.warn(`[VirusScanner] Infected buffer detected: ${filename}`, viruses);
      return {
        isInfected: true,
        virus: viruses.join(", "),
      };
    }

    return { isInfected: false };
  } catch (error) {
    console.error("[VirusScanner] Error scanning buffer:", error);
    return {
      isInfected: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Check if virus scanner is available
 */
export async function isVirusScannerAvailable(): Promise<boolean> {
  const scanner = await initClamScan();
  return scanner !== null;
}

/**
 * Get scanner version info
 */
export async function getScannerVersion(): Promise<string | null> {
  try {
    const scanner = await initClamScan();
    if (!scanner) return null;

    const version = await scanner.getVersion();
    return version;
  } catch (error) {
    console.error("[VirusScanner] Error getting version:", error);
    return null;
  }
}
