import React, { useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { 
  Card, 
  Text, 
  XStack, 
  YStack, 
  Button, 
  Input, 
  Avatar,
  Spinner
} from 'tamagui';
import { 
  User, 
  Mail, 
  Pencil, 
  Save, 
  X, 
  Camera,
  CheckCircle,
  XCircle
} from '@tamagui/lucide-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserInfo, useUpdateUser, useUpdateProfilePicture } from '@/hooks/useUser';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/lib/errorUtils';

const Profile = () => {
  const colors = useThemeColors();
  const toast = useToast();
  const { isVerified, refreshUser } = useAuth();
  const { data: user, isLoading, refetch, isRefetching } = useUserInfo();
  const updateUser = useUpdateUser();
  const updateProfilePicture = useUpdateProfilePicture();

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize edited data when user data loads
  React.useEffect(() => {
    if (user && !isEditing) {
      setEditedData({
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
      });
    }
  }, [user, isEditing]);

  const handleEdit = () => {
    if (user) {
      setEditedData({
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditedData({
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const updateData: { first_name?: string; middle_name?: string | null; last_name?: string } = {};
      
      if (editedData.first_name !== user.first_name) {
        updateData.first_name = editedData.first_name;
      }
      if (editedData.middle_name !== user.middle_name) {
        updateData.middle_name = editedData.middle_name || null;
      }
      if (editedData.last_name !== user.last_name) {
        updateData.last_name = editedData.last_name;
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        setIsUpdating(false);
        return;
      }

      await updateUser.mutateAsync(updateData);
      await refetch();
      await refreshUser();
      setIsEditing(false);
      toast.showSuccess('Profile Updated', 'Your profile has been updated successfully');
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      console.error('❌ Error response data:', JSON.stringify(error?.response?.data, null, 2));
      const errorMessage = extractErrorMessage(error);
      toast.showError('Update Failed', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        toast.showError(
          'Permission Denied',
          'We need camera roll permissions to update your profile picture. Please enable it in your device settings.'
        );
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log('📸 Image Picker Result:', JSON.stringify(result, null, 2));

      // Check if user cancelled
      if (result.canceled) {
        console.log('❌ User cancelled image picker');
        return;
      }

      // Check if we have an image
      if (!result.assets || result.assets.length === 0) {
        console.log('❌ No image assets in result');
        toast.showError('Error', 'No image was selected');
        return;
      }

      const imageUri = result.assets[0].uri;
      console.log('🖼️ Selected Image URI:', imageUri);
      console.log('📋 Image Asset Details:', JSON.stringify(result.assets[0], null, 2));

      // Update profile picture
      setIsUpdating(true);
      console.log('🔄 Starting profile picture update with URI:', imageUri);
      try {
        const updatedUser = await updateProfilePicture.mutateAsync(imageUri);
        console.log('✅ Profile picture update successful:', updatedUser);
        console.log('📸 Updated profile_picture field:', updatedUser.profile_picture);
        await refetch();
        await refreshUser();
        toast.showSuccess(
          'Profile Picture Updated',
          'Your profile picture has been updated successfully'
        );
      } catch (error: any) {
        console.error('❌ Profile picture update failed:', error);
        console.error('❌ Error details:', JSON.stringify(error?.response?.data, null, 2));
        const errorMessage = extractErrorMessage(error);
        toast.showError('Update Failed', errorMessage);
      } finally {
        setIsUpdating(false);
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || 'Failed to pick image. Please try again.';
      toast.showError('Error', errorMessage);
      setIsUpdating(false);
    }
  };

  const [imageError, setImageError] = useState(false);

  const getProfilePictureUrl = () => {
    if (!user?.profile_picture) {
      return null;
    }
    if (user.profile_picture.startsWith('http')) {
      return user.profile_picture;
    }
    // Extract base URL from environment (without /api/v1)
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
    // Construct full URL for media file
    const fullUrl = `${baseUrl}${user.profile_picture}`;
    return fullUrl;
  };

  // Reset image error when user changes
  React.useEffect(() => {
    setImageError(false);
  }, [user?.profile_picture]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor={colors.background} alignItems="center" justifyContent="center">
        <Spinner size="large" color={colors.primary} />
        <Text color={colors.text} marginTop="$4">Loading profile...</Text>
      </YStack>
    );
  }

  if (!user) {
    return (
      <YStack flex={1} backgroundColor={colors.background} alignItems="center" justifyContent="center" padding="$4">
        <XCircle color={colors.red} size={48} />
        <Text color={colors.text} fontSize="$6" fontWeight="600" marginTop="$4">
          Failed to load profile
        </Text>
        <Button 
          onPress={() => refetch()} 
          backgroundColor={colors.primary}
          marginTop="$4"
        >
          <Text color="white">Retry</Text>
        </Button>
      </YStack>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <YStack padding="$4" gap="$4">
        {/* Edit Controls */}
        {!isEditing ? (
          <XStack justifyContent="flex-end" marginBottom="$2">
            <Button
              onPress={handleEdit}
              backgroundColor={colors.primary}
              padding="$3"
              circular
            >
              <Pencil color="white" size={20} />
            </Button>
          </XStack>
        ) : (
          <XStack justifyContent="flex-end" gap="$2" marginBottom="$2">
            <Button
              onPress={handleCancel}
              backgroundColor={colors.gray[200]}
              padding="$3"
              circular
              disabled={isUpdating}
            >
              <X color={colors.text} size={20} />
            </Button>
            <Button
              onPress={handleSave}
              backgroundColor={colors.primary}
              padding="$3"
              circular
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Spinner size="small" color="white" />
              ) : (
                <Save color="white" size={20} />
              )}
            </Button>
          </XStack>
        )}

        {/* Profile Picture Card */}
        <Card
          elevate
          bordered
          animation="bouncy"
          borderColor={colors.border}
          padded
          gap="$4"
          enterStyle={{ opacity: 0, y: 10 }}
          backgroundColor={colors.cardBackground}
        >
          <YStack alignItems="center" gap="$4">
            <Avatar 
              circular 
              size="$12" 
              backgroundColor={colors.gray[200]} 
              overflow="hidden"
              borderWidth={3}
              borderColor={colors.primary}
            >
              {getProfilePictureUrl() && !imageError ? (
                <Image
                  source={{ uri: getProfilePictureUrl()! }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                  onError={() => {
                    setImageError(true);
                  }}
                />
              ) : (
                <Avatar.Fallback backgroundColor={colors.primary}>
                  <YStack alignItems="center" justifyContent="center" flex={1}>
                    <Text 
                      color="white" 
                      fontSize="$12" 
                      fontWeight="700"
                    >
                      {user.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </YStack>
                </Avatar.Fallback>
              )}
            </Avatar>
            {!isEditing && (
              <Button
                onPress={handlePickImage}
                backgroundColor={colors.primary}
                disabled={isUpdating || updateProfilePicture.isPending}
              >
                {updateProfilePicture.isPending ? (
                  <Spinner size="small" color="white" />
                ) : (
                  <>
                    <Camera color="white" size={18} />
                    <Text color="white" fontWeight="600" marginLeft="$2">
                      Change Photo
                    </Text>
                  </>
                )}
              </Button>
            )}
          </YStack>
        </Card>

        {/* User Info Card */}
        <Card
          elevate
          bordered
          animation="bouncy"
          borderColor={colors.border}
          padded
          gap="$4"
          enterStyle={{ opacity: 0, y: 10 }}
          backgroundColor={colors.cardBackground}
        >
          <YStack gap="$4">
            <XStack alignItems="center" gap="$2">
              <User color={colors.primary} size={20} />
              <Text color={colors.text} fontSize="$6" fontWeight="600">
                Personal Information
              </Text>
            </XStack>

            {/* First Name */}
            <YStack gap="$2">
              <Text color={colors.gray[200]} fontSize="$3">
                First Name
              </Text>
              {isEditing ? (
                <Input
                  value={editedData.first_name}
                  onChangeText={(text) => setEditedData({ ...editedData, first_name: text })}
                  placeholder="First Name"
                  backgroundColor={colors.background}
                  borderColor={colors.border}
                  color={colors.text}
                  disabled={isUpdating}
                />
              ) : (
                <Text color={colors.text} fontSize="$5" fontWeight="500">
                  {user.first_name || 'Not set'}
                </Text>
              )}
            </YStack>

            {/* Middle Name */}
            <YStack gap="$2">
              <Text color={colors.gray[200]} fontSize="$3">
                Middle Name
              </Text>
              {isEditing ? (
                <Input
                  value={editedData.middle_name || ''}
                  onChangeText={(text) => setEditedData({ ...editedData, middle_name: text })}
                  placeholder="Middle Name (Optional)"
                  backgroundColor={colors.background}
                  borderColor={colors.border}
                  color={colors.text}
                  disabled={isUpdating}
                />
              ) : (
                <Text color={colors.text} fontSize="$5" fontWeight="500">
                  {user.middle_name || 'Not set'}
                </Text>
              )}
            </YStack>

            {/* Last Name */}
            <YStack gap="$2">
              <Text color={colors.gray[200]} fontSize="$3">
                Last Name
              </Text>
              {isEditing ? (
                <Input
                  value={editedData.last_name}
                  onChangeText={(text) => setEditedData({ ...editedData, last_name: text })}
                  placeholder="Last Name"
                  backgroundColor={colors.background}
                  borderColor={colors.border}
                  color={colors.text}
                  disabled={isUpdating}
                />
              ) : (
                <Text color={colors.text} fontSize="$5" fontWeight="500">
                  {user.last_name || 'Not set'}
                </Text>
              )}
            </YStack>
          </YStack>
        </Card>

        {/* Account Details Card */}
        <Card
          elevate
          bordered
          animation="bouncy"
          borderColor={colors.border}
          padded
          gap="$4"
          enterStyle={{ opacity: 0, y: 10 }}
          backgroundColor={colors.cardBackground}
        >
          <YStack gap="$4">
            <XStack alignItems="center" gap="$2">
              <Mail color={colors.primary} size={20} />
              <Text color={colors.text} fontSize="$6" fontWeight="600">
                Account Details
              </Text>
            </XStack>

            {/* Email */}
            <YStack gap="$2">
              <Text color={colors.gray[200]} fontSize="$3">
                Email
              </Text>
              <Text color={colors.text} fontSize="$5" fontWeight="500">
                {user.email}
              </Text>
            </YStack>

            {/* Username */}
            <YStack gap="$2">
              <Text color={colors.gray[200]} fontSize="$3">
                Username
              </Text>
              <Text color={colors.text} fontSize="$5" fontWeight="500">
                {user.username}
              </Text>
            </YStack>

            {/* Verification Status */}
            <YStack gap="$2">
              <Text color={colors.gray[200]} fontSize="$3">
                Verification Status
              </Text>
              <XStack alignItems="center" gap="$2">
                {isVerified ? (
                  <>
                    <CheckCircle color={colors.green?.[500] || colors.primary} size={20} />
                    <Text color={colors.green?.[500] || colors.primary} fontSize="$5" fontWeight="500">
                      Verified
                    </Text>
                  </>
                ) : (
                  <>
                    <XCircle color={colors.red} size={20} />
                    <Text color={colors.red} fontSize="$5" fontWeight="500">
                      Not Verified
                    </Text>
                  </>
                )}
              </XStack>
            </YStack>

            {/* Date Joined */}
            <YStack gap="$2">
              <Text color={colors.gray[200]} fontSize="$3">
                Member Since
              </Text>
              <Text color={colors.text} fontSize="$5" fontWeight="500">
                {formatDate(user.date_joined)}
              </Text>
            </YStack>

            {/* Last Login */}
            <YStack gap="$2">
              <Text color={colors.gray[200]} fontSize="$3">
                Last Login
              </Text>
              <Text color={colors.text} fontSize="$5" fontWeight="500">
                {formatDate(user.last_login)}
              </Text>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

export default Profile;

