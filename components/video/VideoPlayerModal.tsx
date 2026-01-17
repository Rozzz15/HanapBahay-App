import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { X } from 'lucide-react-native';

interface VideoPlayerModalProps {
  videoUri: string;
  onClose: () => void;
}

export default function VideoPlayerModal({ videoUri, onClose }: VideoPlayerModalProps) {
  const [error, setError] = React.useState<string | null>(null);
  
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = false;
    player.play();
  });

  React.useEffect(() => {
    // Check if video URI is valid
    if (!videoUri || videoUri.trim() === '') {
      setError('Invalid video URI');
      return;
    }
    
    console.log('Video player rendering with URI:', videoUri);
  }, [videoUri]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <X size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {error ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center' }}>
            Failed to load video
          </Text>
          <Text style={{ color: '#CCCCCC', fontSize: 14, marginTop: 10, textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      ) : (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls
          onLoadError={(event) => {
            console.error('Video load error:', event);
            setError('The video file could not be loaded. It may have been deleted from cache.');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
  },
});




