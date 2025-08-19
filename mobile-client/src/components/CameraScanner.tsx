import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary} from 'react-native-image-picker';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

import {COLORS, SPACING, FONT_SIZES, CreateExpenseRequest} from '../types';
import {apiService} from '../services/api';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

interface CameraScannerProps {
  route?: {
    params?: {
      onScanComplete?: (data: Partial<CreateExpenseRequest>) => void;
    };
  };
}

interface ReceiptData {
  amount?: number;
  merchant?: string;
  date?: string;
  items?: Array<{name: string; price: number}>;
  confidence?: number;
}

const CameraScanner: React.FC<CameraScannerProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const cameraRef = useRef<RNCamera>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flashMode, setFlashMode] = useState(RNCamera.Constants.FlashMode.off);
  const [focusDepth, setFocusDepth] = useState(0);

  // Animation values
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  const onScanComplete = (route.params as any)?.onScanComplete;

  useEffect(() => {
    checkCameraPermission();
    startScanAnimation();

    return () => {
      scanAnimation.stopAnimation();
    };
  }, []);

  const checkCameraPermission = async () => {
    const permission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA;

    try {
      const result = await check(permission);

      if (result === RESULTS.GRANTED) {
        setHasPermission(true);
      } else if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        setHasPermission(requestResult === RESULTS.GRANTED);
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setHasPermission(false);
    }
  };

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const takePicture = async () => {
    if (cameraRef.current && !isScanning) {
      setIsScanning(true);

      try {
        const options = {
          quality: 0.8,
          base64: false,
          orientation: 'portrait' as const,
          fixOrientation: true,
        };

        const data = await cameraRef.current.takePictureAsync(options);
        await processReceiptImage(data.uri);
      } catch (error) {
        console.error('Camera error:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
        setIsScanning(false);
      }
    }
  };

  const selectFromGallery = () => {
    const options = {
      mediaType: 'photo' as const,
      quality: 0.8,
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        processReceiptImage(response.assets[0].uri!);
      }
    });
  };

  const processReceiptImage = async (imageUri: string) => {
    setIsProcessing(true);

    try {
      // Animate fade out
      Animated.timing(fadeAnimation, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Call the receipt scanning API
      const receiptData = await apiService.scanReceipt(imageUri);

      if (receiptData && Object.keys(receiptData).length > 0) {
        const extractedData = formatReceiptData(receiptData);

        if (onScanComplete) {
          onScanComplete(extractedData);
          navigation.goBack();
        } else {
          // Navigate to AddExpenseScreen with extracted data
          navigation.navigate('AddExpense' as never, {
            defaultData: extractedData,
          } as never);
        }
      } else {
        // No data extracted - show manual entry option
        Alert.alert(
          'Scan Complete',
          'We couldn\'t extract expense details from this receipt. Would you like to add the expense manually?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resetScanning(),
            },
            {
              text: 'Add Manually',
              onPress: () => {
                if (onScanComplete) {
                  onScanComplete({});
                  navigation.goBack();
                } else {
                  navigation.navigate('AddExpense' as never);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Receipt processing error:', error);
      Alert.alert(
        'Processing Error',
        'Failed to process the receipt. Please try again or add the expense manually.',
        [
          {
            text: 'Try Again',
            onPress: () => resetScanning(),
          },
          {
            text: 'Add Manually',
            onPress: () => {
              if (onScanComplete) {
                onScanComplete({});
                navigation.goBack();
              } else {
                navigation.navigate('AddExpense' as never);
              }
            },
          },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatReceiptData = (receiptData: ReceiptData): Partial<CreateExpenseRequest> => {
    const data: Partial<CreateExpenseRequest> = {};

    if (receiptData.amount && receiptData.amount > 0) {
      data.amount = receiptData.amount;
    }

    if (receiptData.merchant) {
      data.merchant = receiptData.merchant;
      // Use merchant name as description if no items found
      if (!receiptData.items || receiptData.items.length === 0) {
        data.description = `Purchase at ${receiptData.merchant}`;
      }
    }

    if (receiptData.date) {
      data.date = receiptData.date;
    } else {
      data.date = new Date().toISOString();
    }

    if (receiptData.items && receiptData.items.length > 0) {
      // Create description from items
      if (receiptData.items.length === 1) {
        data.description = receiptData.items[0].name;
      } else {
        data.description = `${receiptData.items[0].name} and ${receiptData.items.length - 1} other items`;
      }
    }

    // Fallback description
    if (!data.description) {
      data.description = 'Scanned receipt';
    }

    return data;
  };

  const resetScanning = () => {
    setIsScanning(false);
    setIsProcessing(false);

    // Animate fade in
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleFlash = () => {
    setFlashMode(
      flashMode === RNCamera.Constants.FlashMode.off
        ? RNCamera.Constants.FlashMode.on
        : RNCamera.Constants.FlashMode.off
    );
  };

  const handleCameraReady = () => {
    // Camera is ready
  };

  const handleFocusChanged = (event: any) => {
    setFocusDepth(event.nativeEvent.depth);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.permissionText}>Checking camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="camera-alt" size={64} color={COLORS.textSecondary} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Please enable camera access to scan receipts
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={checkCameraPermission}>
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <Animated.View style={[styles.cameraContainer, {opacity: fadeAnimation}]}>
        <RNCamera
          ref={cameraRef}
          style={styles.camera}
          type={RNCamera.Constants.Type.back}
          flashMode={flashMode}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera to scan receipts',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          onCameraReady={handleCameraReady}
          onFocusChanged={handleFocusChanged}
          captureAudio={false}
          autoFocus={RNCamera.Constants.AutoFocus.on}
          whiteBalance={RNCamera.Constants.WhiteBalance.auto}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}>
              <Icon name="close" size={24} color={COLORS.background} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Scan Receipt</Text>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleFlash}>
              <Icon
                name={flashMode === RNCamera.Constants.FlashMode.on ? 'flash-on' : 'flash-off'}
                size={24}
                color={COLORS.background}
              />
            </TouchableOpacity>
          </View>

          {/* Scanning Frame */}
          <View style={styles.scanFrame}>
            <View style={styles.scanArea}>
              {/* Corner borders */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Scanning line animation */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 200],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>

            <Text style={styles.instructionText}>
              Position the receipt within the frame
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={selectFromGallery}>
              <Icon name="photo-library" size={24} color={COLORS.background} />
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.captureButton,
                (isScanning || isProcessing) && styles.captureButtonDisabled,
              ]}
              onPress={takePicture}
              disabled={isScanning || isProcessing}>
              {isScanning || isProcessing ? (
                <ActivityIndicator size="large" color={COLORS.background} />
              ) : (
                <Icon name="camera" size={32} color={COLORS.background} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => {
                if (onScanComplete) {
                  onScanComplete({});
                  navigation.goBack();
                } else {
                  navigation.navigate('AddExpense' as never);
                }
              }}>
              <Icon name="edit" size={24} color={COLORS.background} />
              <Text style={styles.buttonText}>Manual</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.processingText}>Processing receipt...</Text>
            <Text style={styles.processingSubtext}>
              Extracting expense details
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  permissionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.background,
  },
  scanFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  scanArea: {
    width: screenWidth * 0.8,
    height: 250,
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.background,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.background,
    opacity: 0.8,
  },
  instructionText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  galleryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    minWidth: 60,
  },
  manualButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    minWidth: 60,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  captureButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
  },
  processingText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default CameraScanner;