import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from './colors';

// Dashboard Screen Styles
export const dashboardStyles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  welcome: {
    fontSize: 14,
    color: colors.primaryLighter,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.xs,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  logoutText: {
    color: colors.white,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    width: '48%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: spacing.lg,
    color: colors.textPrimary,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  moduleCard: {
    width: '31%',
    margin: '1%',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moduleIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  moduleName: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  moduleDesc: {
    color: colors.white,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.xs,
    opacity: 0.9,
  },
});

// Land Screen Styles
export const landStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  location: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.md,
  },
  actionText: {
    fontSize: 18,
  },
  sizeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  soilText: {
    fontSize: 12,
    color: colors.textHint,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});

// Inventory Screen Styles
export const inventoryStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  lowStockCard: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  quantityButton: {
    backgroundColor: colors.mediumGray,
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: spacing.xl,
    color: colors.primary,
  },
  reorderText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  lowStockAlert: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  categoryOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.mediumGray,
    margin: spacing.xs,
  },
  categoryOptionSelected: {
    backgroundColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  categoryOptionTextSelected: {
    color: colors.white,
  },
});

// Task Screen Styles
export const taskStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  priorityHigh: {
    backgroundColor: colors.error,
  },
  priorityMedium: {
    backgroundColor: colors.warning,
  },
  priorityLow: {
    backgroundColor: colors.success,
  },
  priorityText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  statusPending: {
    backgroundColor: colors.warning,
  },
  statusCompleted: {
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskDetails: {
    marginTop: spacing.md,
  },
  taskDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

// Finance Screen Styles
export const financeStyles = StyleSheet.create({
  summaryContainer: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.primaryLighter,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.xs,
  },
  summaryProfit: {
    color: colors.success,
  },
  summaryLoss: {
    color: colors.error,
  },
  transactionCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionIncome: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  transactionExpense: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountIncome: {
    color: colors.success,
  },
  amountExpense: {
    color: colors.error,
  },
  transactionDate: {
    fontSize: 10,
    color: colors.textHint,
    marginTop: spacing.xs,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  typeButton: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeButtonInactive: {
    backgroundColor: colors.mediumGray,
  },
  typeButtonTextActive: {
    color: colors.white,
    fontWeight: 'bold',
  },
  typeButtonTextInactive: {
    color: colors.textSecondary,
  },
});

// Labor Screen Styles
export const laborStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  laborName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  laborRole: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  laborRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  attendanceSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  attendanceStatus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  attendancePresent: {
    color: colors.success,
    fontWeight: 'bold',
  },
  attendanceAbsent: {
    color: colors.error,
    fontWeight: 'bold',
  },
  attendanceButtons: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  attendanceButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  presentButton: {
    backgroundColor: colors.success,
  },
  absentButton: {
    backgroundColor: colors.error,
  },
  attendanceButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

// Machinery Screen Styles
export const machineryStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  machineryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  machineryModel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  statusAvailable: {
    backgroundColor: colors.success,
  },
  statusRepair: {
    backgroundColor: colors.warning,
  },
  statusDecommissioned: {
    backgroundColor: colors.error,
  },
  statusText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  maintenanceButton: {
    backgroundColor: colors.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  maintenanceButtonText: {
    color: colors.white,
    fontSize: 12,
  },
});

// Common Screen Styles
export const commonScreenStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: colors.white,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    margin: spacing.xl,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
    color: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.gray,
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});