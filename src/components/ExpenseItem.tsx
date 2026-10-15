import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { Expense, CATEGORY_ICONS } from '@/types/expense';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, useSharedValue, withTiming } from 'react-native-reanimated';
import { GlassCard } from '@/components/GlassCard';

interface ExpenseItemProps {
  expense: Expense;
  index: number;
  onPress?: () => void;
  onLongPress?: () => void;
  onReceiptPress?: () => void;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, index, onPress, onLongPress, onReceiptPress }) => {
  const pressed = useSharedValue(0);
  const formattedDate = new Date(expense.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(expense.amount);

  const pressIn = () => { pressed.value = withTiming(1, { duration: 120 }); };
  const pressOut = () => { pressed.value = withTiming(0, { duration: 160 }); };

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        accessibilityLabel={`${expense.category}, ${formattedAmount}, ${formattedDate}`}
        accessibilityHint="Mantén pulsado para editar o eliminar"
        accessibilityActions={[{ name: 'activate', label: 'Abrir acciones' }]}
      >
        <GlassCard animated animatedValue={pressed}>
          <View style={styles.content}>
            <View style={styles.leftSection}>
              <View style={styles.iconContainer}><LinearGradient colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}><Text style={styles.icon}>{CATEGORY_ICONS[expense.category]}</Text></LinearGradient></View>
              <View style={styles.infoContainer}>
                <Text style={styles.category}>{expense.category}</Text>
                {expense.description ? <Text style={styles.description} numberOfLines={1}>{expense.description}</Text> : null}
                {expense.receiptUri ? <TouchableOpacity onPress={onReceiptPress} accessibilityLabel="Ver comprobante"><Image source={expense.receiptUri} contentFit="cover" style={styles.thumbnail} /></TouchableOpacity> : null}
              </View>
            </View>
            <View style={styles.rightSection}><Text style={styles.amount}>{formattedAmount}</Text><Text style={styles.date}>{formattedDate}</Text></View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.two }, content: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 }, iconContainer: { marginRight: Spacing.two }, iconGradient: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }, icon: { fontSize: 24 }, infoContainer: { flex: 1 }, category: { fontSize: 16, fontWeight: '600', color: LiquidGlassColors.glassText, marginBottom: 2 }, description: { fontSize: 13, color: LiquidGlassColors.glassTextSecondary }, thumbnail: { width: 32, height: 32, borderRadius: Spacing.one, marginTop: Spacing.one }, rightSection: { alignItems: 'flex-end' }, amount: { fontSize: 18, fontWeight: 'bold', color: LiquidGlassColors.primary, marginBottom: 2 }, date: { fontSize: 12, color: LiquidGlassColors.glassTextSecondary },
});
