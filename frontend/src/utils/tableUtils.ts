// Shared table utility functions
export const handleTableSort = (
  column: string,
  currentSortBy: string,
  currentSortOrder: string,
  setSortBy: (val: string) => void,
  setSortOrder: (val: string) => void,
  setPage: (val: number) => void
) => {
  if (currentSortBy === column) {
    setSortOrder(currentSortOrder === 'asc' ? 'desc' : 'asc');
  } else {
    setSortBy(column);
    setSortOrder('asc');
  }
  setPage(1);
};