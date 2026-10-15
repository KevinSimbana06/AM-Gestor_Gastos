import { ExpenseImagePicker } from '@/components/ExpenseImagePicker';
import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/ExpenseContext';
import { expenseFormSchema, ExpenseFormValues } from '@/schemas/ExpenseFormSchema';
import { CATEGORIES, CATEGORY_ICONS, Expense, formatExpenseDate } from '@/types/expense';
import { zodResolver } from '@hookform/resolvers/zod';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface ExpenseFormModalProps {
  visible: boolean;
  onClose: () => void;
  expenseToEdit?: Expense;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ visible, onClose, expenseToEdit }) => {
  const { addExpense, updateExpense } = useExpenses();
  const isEditing = Boolean(expenseToEdit);
  const registeredDate = expenseToEdit?.date ?? new Date();
  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isValid, isSubmitting } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    mode: 'onChange',
    defaultValues: {
      amount: expenseToEdit ? String(expenseToEdit.amount) : '',
      category: expenseToEdit?.category,
      description: expenseToEdit?.description ?? '',
      receiptUri: expenseToEdit?.receiptUri,
    },
  });
  const receiptUri = watch('receiptUri');

  useEffect(() => {
    reset({
      amount: expenseToEdit ? String(expenseToEdit.amount) : '',
      category: expenseToEdit?.category,
      description: expenseToEdit?.description ?? '',
      receiptUri: expenseToEdit?.receiptUri,
    });
  }, [expenseToEdit, reset, visible]);

  const close = () => {
    reset({ amount: '', category: undefined, description: '', receiptUri: undefined });
    onClose();
  };

  const onValid = async (values: ExpenseFormValues) => {
    try {
      const expense: Expense = {
        id: expenseToEdit?.id ?? '',
        amount: parseFloat(values.amount),
        category: values.category,
        date: registeredDate,
        description: values.description?.trim() || undefined,
        receiptUri: values.receiptUri || undefined,
      };
      if (expenseToEdit) {
        await updateExpense(expense);
      } else {
        await addExpense({ amount: expense.amount, category: expense.category, date: new Date(), description: expense.description, receiptUri: expense.receiptUri });
      }
      close();
    } catch (error) {
      console.error('No se pudo guardar el gasto', error);
      Alert.alert('Error', 'No se pudo guardar el gasto. Inténtalo de nuevo.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close}>
          <Animated.View entering={FadeIn} style={StyleSheet.absoluteFill}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableOpacity>
        <Animated.View entering={SlideInDown.springify()} style={styles.sheet}>
          <BlurView intensity={100} tint="light" style={styles.blur}>
            <View style={styles.handle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
              <Text style={styles.title}>{isEditing ? 'Editar Gasto' : 'Agregar Gasto'}</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Fecha de registro</Text>
                <View style={styles.readOnly}><Text style={styles.readOnlyText}>{isEditing ? formatExpenseDate(registeredDate) : formatExpenseDate(registeredDate, true)}</Text></View>
                {isEditing ? <Text style={styles.hint}>La fecha original se conserva</Text> : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Monto (USD)</Text>
                <Controller control={control} name="amount" render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputRow}><Text style={styles.currency}>$</Text><TextInput style={styles.input} value={value} onChangeText={onChange} onBlur={onBlur} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={LiquidGlassColors.glassTextSecondary} /></View>
                )} />
                {errors.amount ? <Text style={styles.error}>{errors.amount.message}</Text> : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Categoría</Text>
                <Controller control={control} name="category" render={({ field: { onChange, value } }) => (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
                    {CATEGORIES.map((category) => {
                      const active = value === category;
                      return <TouchableOpacity key={category} onPress={() => onChange(category)} style={styles.categoryButton}>{active ? <LinearGradient colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]} style={styles.categoryActive}><Text style={styles.categoryIcon}>{CATEGORY_ICONS[category]}</Text><Text style={styles.activeText}>{category}</Text></LinearGradient> : <><Text style={styles.categoryIcon}>{CATEGORY_ICONS[category]}</Text><Text style={styles.categoryText}>{category}</Text></>}</TouchableOpacity>;
                    })}
                  </ScrollView>
                )} />
                {errors.category ? <Text style={styles.error}>{errors.category.message}</Text> : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Descripción (opcional)</Text>
                <Controller control={control} name="description" render={({ field: { onChange, onBlur, value } }) => <TextInput style={[styles.input, styles.description]} value={value} onChangeText={onChange} onBlur={onBlur} multiline maxLength={120} placeholder="Ej: Almuerzo, transporte..." placeholderTextColor={LiquidGlassColors.glassTextSecondary} />} />
                {errors.description ? <Text style={styles.error}>{errors.description.message}</Text> : null}
              </View>

              <Controller control={control} name="receiptUri" render={({ field: { onChange } }) => <ExpenseImagePicker value={receiptUri} onChange={(uri) => setValue('receiptUri', uri, { shouldValidate: true, shouldDirty: true })} />} />

              <View style={styles.buttons}>
                <TouchableOpacity style={styles.cancel} onPress={close}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity disabled={!isValid || isSubmitting} style={styles.submitWrapper} onPress={handleSubmit(onValid)}><LinearGradient colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]} style={styles.submit}><Text style={styles.submitText}>{isEditing ? 'Guardar' : 'Agregar'}</Text></LinearGradient></TouchableOpacity>
              </View>
            </ScrollView>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1 }, backdrop: { ...StyleSheet.absoluteFill }, sheet: { marginTop: 'auto', maxHeight: '92%', borderTopLeftRadius: Spacing.three, borderTopRightRadius: Spacing.three, overflow: 'hidden' }, blur: { paddingTop: Spacing.two, paddingHorizontal: Spacing.four }, handle: { alignSelf: 'center', width: 48, height: 4, borderRadius: 4, backgroundColor: LiquidGlassColors.glassTextSecondary, marginBottom: Spacing.three }, scroll: { paddingBottom: Spacing.four, gap: Spacing.two }, title: { color: LiquidGlassColors.glassText, fontSize: 24, fontWeight: '700', marginBottom: Spacing.two }, field: { gap: Spacing.two }, label: { color: LiquidGlassColors.glassText, fontSize: 16, fontWeight: '600' }, readOnly: { backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: LiquidGlassColors.glassBorder, borderRadius: Spacing.two, padding: Spacing.two }, readOnlyText: { color: LiquidGlassColors.glassText }, hint: { color: LiquidGlassColors.glassTextSecondary, fontSize: 12 }, inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: LiquidGlassColors.glassBorder, borderRadius: Spacing.two }, currency: { color: LiquidGlassColors.glassText, fontSize: 18, paddingLeft: Spacing.two }, input: { flex: 1, minHeight: 44, color: LiquidGlassColors.glassText, padding: Spacing.two }, description: { backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: LiquidGlassColors.glassBorder, borderRadius: Spacing.two, minHeight: 80, textAlignVertical: 'top' }, error: { color: LiquidGlassColors.secondary, fontSize: 12 }, categories: { gap: Spacing.two }, categoryButton: { minWidth: 88, minHeight: 76, alignItems: 'center', justifyContent: 'center', padding: Spacing.one, borderRadius: Spacing.two, backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: LiquidGlassColors.glassBorder }, categoryActive: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', minHeight: 74, borderRadius: Spacing.two }, categoryIcon: { fontSize: 22 }, categoryText: { color: LiquidGlassColors.glassText, fontSize: 12, textAlign: 'center' }, activeText: { color: LiquidGlassColors.glassTextLight, fontSize: 12, textAlign: 'center', fontWeight: '600' }, buttons: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two }, cancel: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48, backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: LiquidGlassColors.glassBorder, borderRadius: Spacing.two }, cancelText: { color: LiquidGlassColors.glassText }, submitWrapper: { flex: 1, borderRadius: Spacing.two, overflow: 'hidden' }, submit: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, submitText: { color: LiquidGlassColors.glassTextLight, fontWeight: '700' },
});

