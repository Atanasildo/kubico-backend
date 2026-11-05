import 'package:flutter/material.dart';

class CardAction {
  final IconData icon;
  final String   label;
  final VoidCallback onTap;
  const CardAction({required this.icon, required this.label, required this.onTap});
}
