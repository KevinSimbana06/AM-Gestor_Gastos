import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { SortOrder } from '@/types/expense';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SortToggleProps {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}

export const SortToggle: React.FC<SortToggleProps> = ({ value, onChange }) => (
  <View style={styles.container} accessibilityRole="tablist">
    {(['desc', 'asc'] as const).map((order) => {
      const active = value === order;
      return (
        <TouchableOpacity
          key={order}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
          onPress={() => onChange(order)}
          style={styles.wrapper}
          activeOpacity={0.8}
        >
          {active ? (
            <LinearGradient
              colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.chip}
            >
              <Text style={styles.activeText}>{order === 'desc' ? '⬇ Mayor a menor' : '⬆ Menor a mayor'}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.chip, styles.inactiveChip]}>
              <Text style={styles.inactiveText}>{order === 'desc' ? '⬇ Mayor a menor' : '⬆ Menor a mayor'}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  wrapper: { flex: 1, borderRadius: Spacing.two, overflow: 'hidden' },
  chip: { alignItems: 'center', justifyContent: 'center', minHeight: 40, paddingHorizontal: Spacing.two },
  inactiveChip: { backgroundColor: 'rgba(255,255,255,0.5)', borderColor: LiquidGlassColors.glassBorder, borderWidth: 1 },
  activeText: { color: LiquidGlassColors.glassTextLight, fontWeight: '600', fontSize: 13 },
  inactiveText: { color: LiquidGlassColors.glassText, fontWeight: '600', fontSize: 13 },
});
