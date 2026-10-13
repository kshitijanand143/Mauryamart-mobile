import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function OfflineScreen({ onRetry }) {
  return (
    <View style={s.container}>
      <Text style={s.icon}>📡</Text>
      <Text style={s.title}>No Internet</Text>
      <Text style={s.sub}>Please check your connection</Text>
      <TouchableOpacity style={s.btn} onPress={onRetry}>
        <Text style={s.btnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon:  { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 8 },
  sub:   { fontSize: 15, color: '#666', marginBottom: 32, textAlign: 'center' },
  btn:   { backgroundColor: '#f97316', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
