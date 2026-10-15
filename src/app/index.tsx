import { ExpenseFormModal } from '@/components/ExpenseFormModal';
import { deleteReceiptImage } from '@/components/ExpenseImagePicker';
import { ExpenseItem } from '@/components/ExpenseItem';
import { MonthlyHeader } from '@/components/MonthlyHeader';
import { SortToggle } from '@/components/SortToggle';
import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/ExpenseContext';
import { Expense, SortOrder, sortExpenses } from '@/types/expense';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { getCurrentMonthExpenses, isLoading, deleteExpense } = useExpenses();
  const [modalVisible, setModalVisible] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | undefined>();
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [receiptToView, setReceiptToView] = useState<string | undefined>();
  const [actionExpense, setActionExpense] = useState<Expense | undefined>();
  const expenses = sortExpenses(getCurrentMonthExpenses(), sortOrder);

  const openAdd = () => { setExpenseToEdit(undefined); setModalVisible(true); };
  const openEdit = (expense: Expense) => { setExpenseToEdit(expense); setModalVisible(true); };
  const closeForm = () => { setModalVisible(false); setExpenseToEdit(undefined); };

  const confirmDelete = (expense: Expense) => {
    Alert.alert('Eliminar gasto', 'Se eliminará este gasto. Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          deleteReceiptImage(expense.receiptUri);
          await deleteExpense(expense.id);
        } catch (error) {
          console.error('No se pudo eliminar el gasto', error);
          Alert.alert('Error', 'No se pudo eliminar el gasto. Inténtalo de nuevo.');
        }
      } },
    ]);
  };

  const openActions = (expense: Expense) => {
    setActionExpense(expense);
  };

  const closeActions = () => setActionExpense(undefined);

  const editFromActions = () => {
    if (!actionExpense) return;
    const expense = actionExpense;
    closeActions();
    openEdit(expense);
  };

  const deleteFromActions = () => {
    if (!actionExpense) return;
    const expense = actionExpense;
    closeActions();
    confirmDelete(expense);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FFF5F9', '#FFE8F0', '#FFF9FC']} style={styles.gradient}>
        <View pointerEvents="none" style={[styles.orb, styles.orbPink]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbOrange]} />
        <View pointerEvents="none" style={[styles.orb, styles.orbPurple]} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.appTitle}>Gastos Poliestudiante</Text>
            <MonthlyHeader />
            <SortToggle value={sortOrder} onChange={setSortOrder} />
            {isLoading ? <View style={styles.emptyState}><ActivityIndicator size="large" color={LiquidGlassColors.primary} /></View> : expenses.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>No hay gastos registrados</Text><Text style={styles.emptyText}>Presiona el botón + para agregar tu primer gasto</Text></View> : <FlatList data={expenses} extraData={sortOrder} keyExtractor={(item) => item.id} renderItem={({ item, index }) => <ExpenseItem expense={item} index={index} onLongPress={() => openActions(item)} onReceiptPress={() => setReceiptToView(item.receiptUri)} />} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} />}
          </View>
          <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.8}><LinearGradient colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}><Text style={styles.fabIcon}>+</Text></LinearGradient></TouchableOpacity>
          <ExpenseFormModal visible={modalVisible} onClose={closeForm} expenseToEdit={expenseToEdit} />
          <Modal visible={Boolean(actionExpense)} transparent animationType="fade" onRequestClose={closeActions}>
            <TouchableOpacity style={styles.actionOverlay} activeOpacity={1} onPress={closeActions}>
              <View style={styles.actionSheet}>
                <Text style={styles.actionTitle}>Acciones del gasto</Text>
                {actionExpense?.receiptUri ? <TouchableOpacity style={styles.actionButton} onPress={() => { const uri = actionExpense.receiptUri; closeActions(); setReceiptToView(uri); }}><Text style={styles.actionText}>Ver comprobante</Text></TouchableOpacity> : null}
                <TouchableOpacity style={styles.actionButton} onPress={editFromActions}><Text style={styles.actionText}>Editar gasto</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={deleteFromActions}><Text style={styles.deleteText}>Eliminar gasto</Text></TouchableOpacity>
                <TouchableOpacity style={styles.cancelAction} onPress={closeActions}><Text style={styles.actionText}>Cancelar</Text></TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
          <Modal visible={Boolean(receiptToView)} transparent animationType="fade" onRequestClose={() => setReceiptToView(undefined)}><TouchableOpacity style={styles.receiptOverlay} activeOpacity={1} onPress={() => setReceiptToView(undefined)}><Image source={receiptToView} contentFit="contain" style={styles.receiptImage} /></TouchableOpacity></Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, gradient: { flex: 1 }, safeArea: { flex: 1 }, content: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.two }, orb: { position: 'absolute', borderRadius: 999 }, orbPink: { width: 220, height: 220, top: 60, left: -60, backgroundColor: 'rgba(255, 107, 157, 0.55)' }, orbOrange: { width: 180, height: 180, top: 260, right: -50, backgroundColor: 'rgba(255, 159, 94, 0.5)' }, orbPurple: { width: 200, height: 200, bottom: 120, left: 20, backgroundColor: 'rgba(168, 120, 220, 0.4)' }, appTitle: { fontSize: 28, fontWeight: 'bold', color: LiquidGlassColors.glassText, marginBottom: Spacing.three, textAlign: 'center' }, listContent: { paddingBottom: 100 }, emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.four }, emptyTitle: { fontSize: 20, fontWeight: '600', color: LiquidGlassColors.glassText, marginBottom: Spacing.two, textAlign: 'center' }, emptyText: { fontSize: 14, color: LiquidGlassColors.glassTextSecondary, textAlign: 'center', lineHeight: 20 }, fab: { position: 'absolute', bottom: Spacing.four, right: Spacing.four, borderRadius: 32, overflow: 'hidden', shadowColor: LiquidGlassColors.shadowDark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }, fabGradient: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center' }, fabIcon: { fontSize: 32, color: LiquidGlassColors.glassTextLight, fontWeight: '300' }, receiptOverlay: { flex: 1, backgroundColor: 'rgba(44,27,71,0.9)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four }, receiptImage: { width: '100%', height: '80%' },
  actionOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,27,71,0.35)' }, actionSheet: { backgroundColor: 'rgba(255,255,255,0.96)', borderTopLeftRadius: Spacing.three, borderTopRightRadius: Spacing.three, padding: Spacing.four, gap: Spacing.two }, actionTitle: { color: LiquidGlassColors.glassText, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.two }, actionButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderColor: LiquidGlassColors.glassBorder, borderWidth: 1, borderRadius: Spacing.two }, cancelAction: { minHeight: 48, justifyContent: 'center', alignItems: 'center' }, actionText: { color: LiquidGlassColors.glassText, fontWeight: '600' }, deleteText: { color: LiquidGlassColors.secondary, fontWeight: '700' },});


