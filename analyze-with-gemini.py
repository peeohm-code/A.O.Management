#!/usr/bin/env python3
"""
Gemini Pro Code Analysis Script
Analyzes the construction management platform codebase
"""

import os
import json
import sys

# Check if google.genai is available
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Error: google-genai package not installed")
    print("Please install with: pip install google-genai")
    sys.exit(1)

def read_file(filepath):
    """Read file content"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def analyze_with_gemini(api_key, analysis_input, schema_content, db_content_sample):
    """Send analysis request to Gemini Pro"""
    
    client = genai.Client(api_key=api_key)
    
    prompt = f"""You are an expert software architect and code reviewer specializing in full-stack web applications.

Please analyze this Construction Management & QC Platform codebase comprehensively.

## Analysis Input:
{analysis_input}

## Database Schema (drizzle/schema.ts):
```typescript
{schema_content[:15000]}  // First 15000 chars
... (schema continues)
```

## Database Functions Sample (server/db.ts):
```typescript
{db_content_sample[:15000]}  // First 15000 chars
... (8000+ lines total)
```

## Your Task:

Provide a comprehensive code review covering:

1. **Executive Summary** (1-10 rating + key points)
2. **Code Quality Issues** (with specific examples)
3. **Architecture Analysis** (scalability, patterns, concerns)
4. **Database Schema Review** (design, indexes, relationships)
5. **Security Analysis** (vulnerabilities, risks)
6. **Performance Analysis** (bottlenecks, optimizations)
7. **Code Duplication & Refactoring** (consolidation opportunities)
8. **Feature Completeness** (incomplete/unused code)
9. **Testing Strategy** (why tests fail, what's missing)
10. **Action Plan** (prioritized improvements: Critical/High/Medium/Low)

Be specific, provide code examples, and give actionable recommendations.

Focus on:
- Why are 22 tests failing?
- How to split the 8000-line db.ts file?
- Is the checklist workflow well-designed?
- Are there security vulnerabilities?
- What's causing performance issues?
- What code is redundant or unused?

Provide detailed, technical analysis with specific file/function references."""

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=8000,
            )
        )
        
        return response.text
    
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return None

def main():
    """Main function"""
    
    # Get API key from environment
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set")
        sys.exit(1)
    
    print("Reading analysis input files...")
    
    # Read analysis input
    analysis_input = read_file('gemini-analysis-input.md')
    if not analysis_input:
        print("Error: Could not read gemini-analysis-input.md")
        sys.exit(1)
    
    # Read schema
    schema_content = read_file('drizzle/schema.ts')
    if not schema_content:
        print("Error: Could not read drizzle/schema.ts")
        sys.exit(1)
    
    # Read db.ts sample (first 20000 chars to avoid token limits)
    db_content = read_file('server/db.ts')
    if not db_content:
        print("Error: Could not read server/db.ts")
        sys.exit(1)
    
    db_content_sample = db_content[:20000]
    
    print(f"Analysis input: {len(analysis_input)} chars")
    print(f"Schema: {len(schema_content)} chars")
    print(f"DB sample: {len(db_content_sample)} chars")
    print()
    print("Sending request to Gemini Pro...")
    print("This may take 30-60 seconds...")
    print()
    
    # Analyze with Gemini
    result = analyze_with_gemini(api_key, analysis_input, schema_content, db_content_sample)
    
    if result:
        # Save result
        output_file = 'gemini-analysis-output.md'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Gemini Pro Code Analysis Report\n")
            f.write("## Construction Management & QC Platform\n\n")
            f.write("**Generated:** 2025-01-23\n")
            f.write("**Model:** gemini-2.0-flash-exp\n")
            f.write("**Checkpoint:** 9d554436\n\n")
            f.write("---\n\n")
            f.write(result)
        
        print(f"✓ Analysis complete!")
        print(f"✓ Output saved to: {output_file}")
        print()
        print("Summary:")
        print(result[:500] + "..." if len(result) > 500 else result)
    else:
        print("✗ Analysis failed")
        sys.exit(1)

if __name__ == '__main__':
    main()
