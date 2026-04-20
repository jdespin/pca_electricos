import 'package:flutter/material.dart';
import 'ordenes_list_page.dart';

class OrdenesEvaluadasPage extends StatelessWidget {
  const OrdenesEvaluadasPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrdenesListPage(status: 'evaluada');
  }
}
