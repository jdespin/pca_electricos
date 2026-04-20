import 'package:flutter/material.dart';
import 'ordenes_list_page.dart';

class OrdenesProcesoPage extends StatelessWidget {
  const OrdenesProcesoPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrdenesListPage(status: 'proceso');
  }
}
