/**
 * Automated Router Splitting Script
 * 
 * This script automatically splits server/routers.ts into feature-based modules
 * to improve maintainability and reduce file complexity.
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouterDefinition {
  name: string;
  startLine: number;
  endLine: number;
  content: string;
}

/**
 * Parse routers.ts and extract router definitions
 */
function parseRoutersFile(filePath: string): {
  imports: string;
  routers: RouterDefinition[];
  appRouterStart: number;
  appRouterContent: string;
  typeExport: string;
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Extract imports (everything before first router definition)
  let importEndLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^const \w+Router = router\(\{/)) {
      importEndLine = i - 1;
      break;
    }
  }
  
  const imports = lines.slice(0, importEndLine + 1).join('\n');
  
  // Find all router definitions
  const routers: RouterDefinition[] = [];
  const routerPattern = /^const (\w+Router) = router\(\{/;
  
  let currentRouter: RouterDefinition | null = null;
  let braceCount = 0;
  
  for (let i = importEndLine + 1; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(routerPattern);
    
    if (match && !currentRouter) {
      // Start of a new router
      currentRouter = {
        name: match[1],
        startLine: i,
        endLine: -1,
        content: ''
      };
      braceCount = 0;
    }
    
    if (currentRouter) {
      // Count braces to find end of router
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      currentRouter.content += line + '\n';
      
      // End of router definition
      if (braceCount === 0 && line.includes('});')) {
        currentRouter.endLine = i;
        routers.push(currentRouter);
        currentRouter = null;
      }
    }
    
    // Check for appRouter
    if (line.match(/^export const appRouter = router\(\{/)) {
      // Find appRouter content
      const appRouterStart = i;
      let appBraceCount = 0;
      let appRouterLines: string[] = [];
      
      for (let j = i; j < lines.length; j++) {
        const appLine = lines[j];
        appRouterLines.push(appLine);
        
        for (const char of appLine) {
          if (char === '{') appBraceCount++;
          if (char === '}') appBraceCount--;
        }
        
        if (appBraceCount === 0 && appLine.includes('});')) {
          const appRouterContent = appRouterLines.join('\n');
          const typeExport = lines.slice(j + 1).join('\n');
          
          return {
            imports,
            routers,
            appRouterStart,
            appRouterContent,
            typeExport
          };
        }
      }
    }
  }
  
  return {
    imports,
    routers,
    appRouterStart: -1,
    appRouterContent: '',
    typeExport: ''
  };
}

/**
 * Generate router file content
 */
function generateRouterFile(
  routerName: string,
  routerContent: string,
  baseImports: string
): string {
  // Extract necessary imports from base imports
  const necessaryImports = [
    'import { z } from "zod";',
    'import { TRPCError } from "@trpc/server";',
    'import { protectedProcedure, publicProcedure, router, roleBasedProcedure } from "../_core/trpc";',
    'import * as db from "../db";',
  ];
  
  // Add specific imports based on router content
  const additionalImports: string[] = [];
  
  if (routerContent.includes('validateTaskCreateInput') || 
      routerContent.includes('validateTaskUpdateInput') ||
      routerContent.includes('validateInspectionSubmission') ||
      routerContent.includes('validateDefectCreateInput') ||
      routerContent.includes('validateDefectUpdateInput')) {
    additionalImports.push('import { validateTaskCreateInput, validateTaskUpdateInput, validateInspectionSubmission, validateDefectCreateInput, validateDefectUpdateInput } from "@shared/validationUtils";');
  }
  
  if (routerContent.includes('canEditDefect') || routerContent.includes('canDeleteDefect')) {
    additionalImports.push('import { canEditDefect, canDeleteDefect } from "@shared/permissions";');
  }
  
  if (routerContent.includes('boolToInt')) {
    additionalImports.push('import { boolToInt } from "../utils/typeHelpers.js";');
  }
  
  if (routerContent.includes('getTaskDisplayStatus') || 
      routerContent.includes('getTaskDisplayStatusLabel') ||
      routerContent.includes('getTaskDisplayStatusColor')) {
    additionalImports.push('import { getTaskDisplayStatus, getTaskDisplayStatusLabel, getTaskDisplayStatusColor } from "../taskStatusHelper";');
  }
  
  if (routerContent.includes('storagePut')) {
    additionalImports.push('import { storagePut } from "../storage";');
  }
  
  if (routerContent.includes('notifyOwner')) {
    additionalImports.push('import { notifyOwner } from "../_core/notification";');
  }
  
  if (routerContent.includes('emitNotification')) {
    additionalImports.push('import { emitNotification } from "../_core/socket";');
  }
  
  if (routerContent.includes('createNotification')) {
    additionalImports.push('import { createNotification } from "../notificationService";');
  }
  
  if (routerContent.includes('analyticsService')) {
    additionalImports.push('import * as analyticsService from "../services/analytics.service";');
  }
  
  if (routerContent.includes('generateProjectExport') || routerContent.includes('generateProjectReport')) {
    additionalImports.push('import { generateProjectExport, generateProjectReport } from "../downloadProject";');
  }
  
  if (routerContent.includes('generateArchiveExcel')) {
    additionalImports.push('import { generateArchiveExcel } from "../excelExport";');
  }
  
  if (routerContent.includes('checkArchiveWarnings')) {
    additionalImports.push('import { checkArchiveWarnings } from "../archiveNotifications";');
  }
  
  if (routerContent.includes('logger')) {
    additionalImports.push('import { logger } from "../logger";');
  }
  
  const allImports = [...necessaryImports, ...additionalImports].join('\n');
  
  return `${allImports}

/**
 * ${routerName.replace('Router', '')} Router
 * Auto-generated from server/routers.ts
 */
export ${routerContent}`;
}

/**
 * Generate new main routers.ts file
 */
function generateMainRoutersFile(
  baseImports: string,
  routerNames: string[],
  appRouterContent: string,
  typeExport: string
): string {
  // Import all router modules
  const routerImports = routerNames.map(name => {
    const fileName = name.charAt(0).toLowerCase() + name.slice(1);
    return `import { ${name} } from "./routers/${fileName}";`;
  }).join('\n');
  
  return `${baseImports}

// Import feature-based routers
${routerImports}

/**
 * Main Application Router
 * Combines all feature-based routers
 */
${appRouterContent}

${typeExport}`;
}

/**
 * Main execution
 */
async function main() {
  const projectRoot = path.join(__dirname, '..');
  const routersFilePath = path.join(projectRoot, 'server', 'routers.ts');
  const routersDir = path.join(projectRoot, 'server', 'routers');
  
  console.log('🔍 Parsing server/routers.ts...');
  const { imports, routers, appRouterContent, typeExport } = parseRoutersFile(routersFilePath);
  
  console.log(`✅ Found ${routers.length} router definitions`);
  
  // Create routers directory
  if (!fs.existsSync(routersDir)) {
    fs.mkdirSync(routersDir, { recursive: true });
    console.log('📁 Created server/routers/ directory');
  }
  
  // Generate individual router files
  console.log('\n📝 Generating router files...');
  const routerNames: string[] = [];
  
  for (const router of routers) {
    const fileName = router.name.charAt(0).toLowerCase() + router.name.slice(1) + '.ts';
    const filePath = path.join(routersDir, fileName);
    const fileContent = generateRouterFile(router.name, router.content, imports);
    
    fs.writeFileSync(filePath, fileContent);
    routerNames.push(router.name);
    console.log(`  ✓ ${fileName}`);
  }
  
  // Backup original routers.ts
  const backupPath = path.join(projectRoot, 'server', 'routers.ts.backup');
  fs.copyFileSync(routersFilePath, backupPath);
  console.log(`\n💾 Backed up original routers.ts to routers.ts.backup`);
  
  // Generate new main routers.ts
  const newMainContent = generateMainRoutersFile(imports, routerNames, appRouterContent, typeExport);
  fs.writeFileSync(routersFilePath, newMainContent);
  console.log('✅ Generated new server/routers.ts');
  
  console.log('\n✨ Router splitting completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`  - Original file: 3937 lines`);
  console.log(`  - Split into: ${routers.length} router files`);
  console.log(`  - New main file: ~${newMainContent.split('\n').length} lines`);
  console.log(`\n⚠️  Next steps:`);
  console.log(`  1. Review generated files in server/routers/`);
  console.log(`  2. Run tests to verify functionality`);
  console.log(`  3. If issues occur, restore from routers.ts.backup`);
}

main().catch(console.error);
