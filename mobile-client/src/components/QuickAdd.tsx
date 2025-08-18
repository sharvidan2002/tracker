import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {COLORS, SPACING, FONT_SIZES} from '../types';

interface QuickAddProps {
  onAdd: (amount: number, description: string) => Promise<void>;
}

const QUICK_AMOUNTS = [5, 10, 25, 50];
const QUICK_DESCRIPTIONS = [
  'Coffee',
  'Lunch',
  'Gas',
  'Parking',
  'Snack',
  'Grocery',
];

const QuickAdd: React.FC<QuickAddProps> = ({onAdd}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleQuickDescription = (quickDescription: string) => {
    setDescription(quickDescription);
  };

  const handleAdd = async () => {
    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      await onAdd(amountNumber, description.trim());
      setAmount('');
      setDescription('');
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAmount('');
    setDescription('');
  };

  return (
    <View style={styles.container}>
      {/* Amount Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmountsContainer}>
          {QUICK_AMOUNTS.map(quickAmount => (
            <TouchableOpacity
              key={quickAmount}
              style={[
                styles.quickAmountButton,
                amount === quickAmount.toString() && styles.quickAmountButtonActive,
              ]}
              onPress={() => handleQuickAmount(quickAmount)}
              disabled={isLoading}>
              <Text
                style={[
                  styles.quickAmountText,
                  amount === quickAmount.toString() && styles.quickAmountTextActive,
                ]}>
                ${quickAmount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="What did you spend on?"
          placeholderTextColor={COLORS.textSecondary}
          value={description}
          onChangeText={setDescription}
          editable={!isLoading}
        />

        {/* Quick Description Buttons */}
        <View style={styles.quickDescriptionsContainer}>
          {QUICK_DESCRIPTIONS.map(quickDescription => (
            <TouchableOpacity
              key={quickDescription}
              style={[
                styles.quickDescriptionButton,
                description === quickDescription && styles.quickDescriptionButtonActive,
              ]}
              onPress={() => handleQuickDescription(quickDescription)}
              disabled={isLoading}>
              <Text
                style={[
                  styles.quickDescriptionText,
                  description === quickDescription && styles.quickDescriptionTextActive,
                ]}>
                {quickDescription}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          disabled={isLoading || (!amount && !description)}>
          <Icon name="refresh" size={18} color={COLORS.textSecondary} />
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, isLoading && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={isLoading || !amount.trim() || !description.trim()}>
          <Icon name="add" size={18} color={COLORS.background} />
          <Text style={styles.addButtonText}>
            {isLoading ? 'Adding...' : 'Quick Add'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  inputSection: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickAmountButton: {
    backgroundColor: COLORS.background,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickAmountButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickAmountText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  quickAmountTextActive: {
    color: COLORS.background,
  },
  descriptionInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  quickDescriptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickDescriptionButton: {
    backgroundColor: COLORS.background,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickDescriptionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickDescriptionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  quickDescriptionTextActive: {
    color: COLORS.background,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  resetButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  addButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  addButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.background,
  },
});

export default QuickAdd;