/**
 * Utility functions for data extraction and manipulation
 */

/**
 * Extract data from nested API response
 * Handles both {data: [...]} and direct array responses
 */
export const extractData = <T = any>(result: any): T[] => {
  return result.data?.data || result.data || [];
};

/**
 * Extract single object from API response
 */
export const extractObject = <T = any>(result: any): T | null => {
  return result.data?.data || result.data || null;
};

/**
 * Parse date string to Date object (handles ISO format)
 */
export const parseDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const parts = dateString.split('T')[0].split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

/**
 * Format Date object to YYYY-MM-DD string
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
