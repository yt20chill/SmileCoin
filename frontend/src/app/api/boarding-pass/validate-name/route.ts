// Boarding pass name validation endpoint

import { NextRequest, NextResponse } from 'next/server';

function normalizeNameForComparison(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const normalized1 = normalizeNameForComparison(name1);
  const normalized2 = normalizeNameForComparison(name2);
  
  // Exact match
  if (normalized1 === normalized2) {
    return 1.0;
  }
  
  // Levenshtein distance for similarity calculation
  const matrix = Array(normalized2.length + 1).fill(null).map(() => 
    Array(normalized1.length + 1).fill(null)
  );
  
  for (let i = 0; i <= normalized1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= normalized2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= normalized2.length; j++) {
    for (let i = 1; i <= normalized1.length; i++) {
      const indicator = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  const distance = matrix[normalized2.length][normalized1.length];
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  return maxLength === 0 ? 1.0 : 1 - (distance / maxLength);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extractedName, registeredName } = body;
    
    if (!extractedName || !registeredName) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Both extracted name and registered name are required',
          code: 'MISSING_NAMES'
        },
        { status: 400 }
      );
    }
    
    // Calculate similarity
    const confidence = calculateNameSimilarity(extractedName, registeredName);
    
    // Consider names valid if similarity is >= 80%
    const isValid = confidence >= 0.8;
    
    // Additional validation rules
    const extractedWords = extractedName.toLowerCase().split(/\s+/);
    const registeredWords = registeredName.toLowerCase().split(/\s+/);
    
    // Check if at least one word matches exactly (for common name variations)
    const hasExactWordMatch = extractedWords.some((word: string) => 
      registeredWords.some((regWord: string) => word === regWord && word.length > 2)
    );
    
    // Boost confidence if there's an exact word match
    const finalConfidence = hasExactWordMatch ? Math.max(confidence, 0.85) : confidence;
    const finalIsValid = finalConfidence >= 0.8;
    
    return NextResponse.json({
      success: true,
      isValid: finalIsValid,
      confidence: finalConfidence,
      details: {
        extractedName,
        registeredName,
        normalizedExtracted: normalizeNameForComparison(extractedName),
        normalizedRegistered: normalizeNameForComparison(registeredName),
        hasExactWordMatch,
        similarity: confidence
      },
      message: finalIsValid 
        ? 'Names match successfully' 
        : 'Names do not match sufficiently'
    });
    
  } catch (error) {
    console.error('Name validation error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error during name validation',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}