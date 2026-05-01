export const buttonStyles = {
  approve: {
    minWidth: '90px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontWeight: 600,
    textTransform: 'none',
    '&:hover': { backgroundColor: '#059669' },
    '&:disabled': { backgroundColor: '#d1d5db' }
  },
  reject: {
    minWidth: '90px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontWeight: 600,
    textTransform: 'none',
    '&:hover': { backgroundColor: '#dc2626' },
    '&:disabled': { backgroundColor: '#d1d5db' }
  }
};

export const statusBadgeStyles = {
  pending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    px: 1.5,
    py: 0.5,
    borderRadius: 1,
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: '0.875rem',
    fontWeight: 600,
  }
};

export const tableStyles = {
  headerCell: {
    fontSize: '1rem',
    fontWeight: 700,
    py: 2
  },
  bodyCell: {
    py: 2.5,
    fontSize: '0.95rem',
    fontWeight: 500
  },
  row: {
    '&:hover': { bgcolor: 'action.hover' }
  }
};

export const dashboardLayoutStyles = {
  logoContainer: {
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.22)',
    borderRadius: 2,
    px: 1.25,
    py: 0.75,
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)',
    lineHeight: 0,
  },
};

export const adminUserDirectoryStyles = {
  headerRow: {
    '& .MuiTableCell-head': {
      backgroundColor: '#ffffff !important',
      color: '#111111 !important',
      fontWeight: 700,
      py: 2,
      borderBottomColor: '#e5e7eb',
    },
  },
  actionIconButton: {
    p: 0.65,
    borderRadius: 1.5,
    border: '1px solid',
    borderColor: 'grey.300',
    backgroundColor: 'grey.50',
    color: 'text.secondary',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'primary.main',
      borderColor: 'primary.main',
      color: 'common.white',
    },
  },
};

export const dashboardStyles = {
  statsCard: {
    p: 2,
    flex: '1 1 200px'
  },
  interactiveCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: 6
    }
  },
  statsContainer: {
    display: 'flex',
    gap: 2,
    flexWrap: 'wrap',
    mb: 4
  },
  navigationCardsGrid: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
    gap: 2,
    mb: 4
  },
  navigationCard: {
    p: 3,
    cursor: 'pointer',
    transition: 'all 0.3s',
    '&:hover': {
      boxShadow: 4,
      transform: 'translateY(-2px)'
    }
  },
  navigationCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    mb: 1
  },
  navigationCardIcon: {
    fontSize: 32,
    color: 'primary.main'
  },
  clickableCard: {
    p: 3,
    mb: 4,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      boxShadow: 4,
      transform: 'translateY(-2px)'
    }
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 2,
    bgcolor: 'primary.main',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  flexRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 2
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  sectionHeader: {
    mb: 3,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  searchContainer: {
    display: 'flex',
    gap: 2,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end'
  },
  holidayItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 1,
    p: 1.5,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1
  }
};

export const employeeRowStyles = {
  avatarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5
  },
  avatar: {
    width: 40,
    height: 40,
    fontSize: '0.875rem',
    fontWeight: 600
  },
  roleChip: {
    fontWeight: 500,
    minWidth: 80,
    height: 28
  },
  locationBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 0.5,
    minWidth: 120
  },
  roleBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 0.5,
    minWidth: 140
  },
  roleChipContainer: {
    display: 'flex',
    gap: 0.5,
    flexWrap: 'wrap'
  }
};

export const formStyles = {
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    mt: 2
  },
  searchField: {
    width: { xs: '100%', md: 'min(56vw, 720px)' },
    minWidth: { md: 520 },
    '& .MuiInputBase-root': {
      height: 48,
    },
  },
  actionButton: {
    height: 48,
    px: 3,
    whiteSpace: 'nowrap'
  }
};
