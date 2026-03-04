document.getElementById("guardarTodoBtn").addEventListener("click", () => {
  const caja = parseFloat(document.getElementById("montoCaja").value) || 0;
  
  // Recolectar ventas
  const ventas = [...document.querySelectorAll(".venta-item")].map(item => ({
    vendedor: item.querySelector(".vendedor").value,
    ciudad: item.querySelector(".ciudad").value,
    producto: item.querySelector(".producto").value,
    cantidad: parseFloat(item.querySelector(".cantidad").value) || 0,
    precio: parseFloat(item.querySelector(".precio").value) || 0
  }));

  // Recolectar gastos
  const gastos = [...document.querySelectorAll(".gasto-item")].map(item => ({
    descripcion: item.querySelector(".descripcion").value,
    monto: parseFloat(item.querySelector(".monto").value) || 0
  }));

  // Recolectar créditos
  const creditos = [...document.querySelectorAll(".credito-item")].map(item => ({
    nombre: item.querySelector(".nombre").value,
    detalle: item.querySelector(".detalle").value,
    monto: parseFloat(item.querySelector(".monto").value) || 0
  }));

  // Calcular totales
  const ventasTotales = ventas.reduce((sum, v) => sum + (v.cantidad * v.precio), 0);
  const gastosTotales = gastos.reduce((sum, g) => sum + g.monto, 0);
  const creditosTotales = creditos.reduce((sum, c) => sum + c.monto, 0);
  const resultadoFinal = caja + ventasTotales - gastosTotales + creditosTotales;

  // Mostrar en consola (o enviar a Supabase)
  console.log({
    caja, ventas, gastos, creditos,
    ventasTotales, gastosTotales, creditosTotales, resultadoFinal
  });

  alert("✅ Registro guardado correctamente.");

  // Limpiar formulario
  document.getElementById("montoCaja").value = "";
  document.getElementById("ventasContainer").innerHTML = "";
  document.getElementById("gastosContainer").innerHTML = "";
  document.getElementById("creditosContainer").innerHTML = "";

  // Reset de totales
  document.getElementById("cajaInicialTotal").textContent = "L.0.00";
  document.getElementById("ventasTotales").textContent = "L.0.00";
  document.getElementById("gastosTotales").textContent = "L.0.00";
  document.getElementById("creditosTotales").textContent = "L.0.00";
  document.getElementById("resultadoFinal").textContent = "L.0.00";
  document.getElementById("resultadoFinalDia").textContent = "L.0.00";
});
