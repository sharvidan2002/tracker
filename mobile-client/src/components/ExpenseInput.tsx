import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DatePicker from 'react-native-date-picker';

import {
  COLORS,
  SPACING,
  FONT_SIZES,
  CreateExpenseRequest,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
} from '../types';

interface ExpenseInputProps {
  onSubmit: (expense: CreateExpenseRequest) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<CreateExpenseRequest>;
  onCancel?: () => void;
}

const ExpenseInput: React.FC<ExpenseInputProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
  onCancel,
}) => {
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<ExpenseCategory | ''>(
    initialData?.category || '',
  );
  const [merchant, setMerchant] = useState(initialData?.merchant || '');
  const [date, setDate] = useState(
    initialData?.date ? new Date(initialData.date) : new Date(),
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amountNumber = parseFloat(amount);
      if (isNaN(amountNumber) || amountNumber <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      }
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const expenseData: CreateExpenseRequest = {
        amount: parseFloat(amount),
        description: description.trim(),
        category: category || undefined,
        merchant: merchant.trim() || undefined,
        date: date.toISOString(),
        tags: tags.length > 0 ? tags : undefined,
      };

      await onSubmit(expenseData);

      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setMerchant('');
      setDate(new Date());
      setTags([]);
      setNewTag('');
      setErrors({});
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save expense',
      );
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };

  return (
    <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Expense</Text>
          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Icon name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount *</Text>
          <View style={[styles.amountContainer, errors.amount && styles.errorBorder]}>
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
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, errors.description && styles.errorBorder]}
            placeholder="What did you spend on?"
            placeholderTextColor={COLORS.textSecondary}
            value={description}
            onChangeText={setDescription}
            editable={!isLoading}
            maxLength={255}
            multiline
            numberOfLines={2}
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
          <Text style={styles.helperText}>
            {description.length}/255 characters
          </Text>
        </View>

        {/* Category Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowCategoryPicker(true)}
            disabled={isLoading}>
            <Text
              style={[
                styles.pickerText,
                !category && styles.pickerPlaceholder,
              ]}>
              {category || 'Select category (optional)'}
            </Text>
            <Icon
              name="keyboard-arrow-down"
              size={24}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Merchant Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Merchant</Text>
          <TextInput
            style={styles.input}
            placeholder="Where did you spend? (optional)"
            placeholderTextColor={COLORS.textSecondary}
            value={merchant}
            onChangeText={setMerchant}
            editable={!isLoading}
            maxLength={100}
          />
        </View>

        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowDatePicker(true)}
            disabled={isLoading}>
            <Text style={styles.pickerText}>{formatDate(date)}</Text>
            <Icon
              name="calendar-today"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Tags Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add a tag"
              placeholderTextColor={COLORS.textSecondary}
              value={newTag}
              onChangeText={setNewTag}
              editable={!isLoading && tags.length < 5}
              maxLength={20}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.addTagButton,
                (!newTag.trim() || tags.length >= 5) && styles.disabledButton,
              ]}
              onPress={addTag}
              disabled={!newTag.trim() || tags.length >= 5 || isLoading}>
              <Icon name="add" size={20} color={COLORS.background} />
            </TouchableOpacity>
          </View>

          {/* Tags Display */}
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity
                    onPress={() => removeTag(tag)}
                    disabled={isLoading}>
                    <Icon name="close" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.helperText}>Maximum 5 tags</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}>
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Saving...' : 'Save Expense'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={showDatePicker}
        date={date}
        mode="date"
        maximumDate={new Date()}
        onConfirm={selectedDate => {
          setShowDatePicker(false);
          setDate(selectedDate);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoryList}>
              <TouchableOpacity
                style={styles.categoryOption}
                onPress={() => {
                  setCategory('');
                  setShowCategoryPicker(false);
                }}>
                <Text style={styles.categoryOptionText}>No Category</Text>
                {!category && (
                  <Icon name="check" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
              {EXPENSE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryPicker(false);
                  }}>
                  <Text style={styles.categoryOptionText}>{cat}</Text>
                  {category === cat && (
                    <Icon name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  cancelButton: {
    padding: SPACING.sm,
  },
  section: {
    padding: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingVertical: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        textAlignVertical: 'top',
      },
    }),
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  pickerPlaceholder: {
    color: COLORS.textSecondary,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tagInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addTagButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    gap: SPACING.xs,
  },
  tagText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  errorBorder: {
    borderColor: COLORS.error,
  },
  actionContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryList: {
    paddingVertical: SPACING.sm,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  categoryOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
});

export default ExpenseInput;