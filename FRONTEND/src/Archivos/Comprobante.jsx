import React from "react";
import { useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios"; // Lo necesitamos para avisarle al backend
import "../css/comprobante.css"
import api from "../api/api"
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const Comprobante = () => {
  const { state } = useLocation();
  const { factura } = state || {};
  const vendedor = JSON.parse(localStorage.getItem("usuario"));

  React.useEffect(() => {
  const guardarPDF = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      await generarYSubirPDF();

      console.log(
        `✅ PDF DE FACTURA ${factura.id} GUARDADO EN VERCEL BLOB`
      );

    } catch (error) {
      console.error("❌ NO SE PUDO GUARDAR EL PDF:", error);
    }
  };

  if (factura?.id) {
    guardarPDF();
  }
}, [factura?.id]);


  if (!factura) return <h2>No hay datos</h2>;
  const formatear = (num) => new Intl.NumberFormat("es-CO").format(num);


 const notificarYEnviarCorreo = async () => {
  try {

    // Nos aseguramos de que exista el PDF
    await generarYSubirPDF();

    // Ahora sí lo enviamos
    const res = await api.post(
      `/EnviarFacturaFisica/${factura.id}`
    );

    console.log("RESPUESTA:", res.data);

    alert("Factura enviada al correo del cliente con éxito");

  } catch (err) {

    console.error("ERROR COMPLETO:", err);

    if (err.response) {
      alert(
        err.response.data?.mensaje ||
        "Error al enviar factura"
      );
    } else {
      alert("No se pudo conectar con el servidor");
    }
  }
};

const generarYSubirPDF = async () => {
  try {
    console.log(`📄 GENERANDO PDF DE FACTURA ${factura.id}...`);

    const elemento = document.querySelector(".factura-paper");

    if (!elemento) {
      throw new Error("No se encontró la factura");
    }

    const canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const ancho = 210;
    const alto = (canvas.height * ancho) / canvas.width;

    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      ancho,
      alto
    );

    const pdfBlob = pdf.output("blob");

    const formData = new FormData();

    formData.append(
      "pdf",
      pdfBlob,
      `Factura-${factura.id}.pdf`
    );

    const respuesta = await api.put(
      `/SubirPDF/${factura.id}`,
      formData
    );

    console.log("✅ PDF GUARDADO");
    console.log("🔗 URL:", respuesta.data.pdf);

    return respuesta.data.pdf;

  } catch (error) {
    console.error(
      "❌ ERROR GENERANDO PDF:",
      error.response?.data || error
    );

    throw error;
  }
};

  return (
    <div className="comprobante-container">
      <div className="factura-paper">
        {/* ENCABEZADO SUPERIOR */}
        <div className="header-grid">
          <div className="logo-section">
            <img src="/imagenes/logo.png" alt="logo" className="logo-siigo" />
          </div>
          <div className="empresa-details">
            <h1>MISAMOO S.A.S</h1>
            <p className="nit">NIT : 809,736,794 - 1</p>
            <p>Bogotá D.C. - BOGOTA - COLOMBIA</p>
            <p>Tel: 3106072362</p>
            <p>Responsable de IVA</p>
          </div>
          <div className="qr-section">
            <QRCodeCanvas value={`factura-${factura.id}`} size={80} />
          </div>
        </div>

        {/* BLOQUE TÍTULO FACTURA */}
        <div className="factura-titulo-box">
          <div className="titulo-izq">
             <div className="row-grid">
                <span className="label">Cliente</span>
                <span className="value">{factura.nombre} {factura.apellido}</span>
                <span className="label">Teléfono</span>
                <span className="value">{factura.telefono}</span>
             </div>
             <div className="row-grid">
                <span className="label">NIT</span>
                <span className="value">{factura.documento}</span>
                <span className="label">Vendedor</span>
                <span className="value">{vendedor ? vendedor.nombre : "VENDEDOR PRINCIPAL"}</span>
             </div>
          </div>
          <div className="titulo-der">
            <h4>FACTURA DE VENTA</h4>
            <p className="folio">No: {factura.id}</p>
            <div className="fechas">
                <p>Generación: {new Date(factura.fecha).toLocaleDateString()}</p>
                <p>Vencimiento: {new Date(factura.fecha).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <table className="tabla-siigo">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Cant</th>
              <th>V. Unit</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {factura.items?.map((item, i) => (
              <tr key={i}>
                <td>{item.codigo || '001'}</td>
                <td>{item.nombre}</td>
                <td>{item.cantidad}</td>
                <td>{formatear(item.precio)}</td>
                <td>{formatear(item.precio * item.cantidad)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SECCIÓN INFERIOR: TOTALES Y LETRAS */}
        <div className="footer-factura">
          <div className="letras-y-pagos">
            <p><strong>VALOR EN LETRAS</strong></p>
            <p className="texto-letras">VALOR TOTAL EN PESOS M/CTE</p>
            <div className="metodo-pago-box">
                <strong>CONDICION DE PAGO:</strong> {factura.metodo_pago}
            </div>
          </div>
          <div className="totales-box">
            <div className="total-row"><span>Total Bruto</span> <span>{formatear(factura.subtotal)}</span></div>
            <div className="total-row"><span>IVA</span> <span>{formatear(factura.iva)}</span></div>
            <div className="total-row final"><span>Total a Pagar</span> <span>$ {formatear(factura.total)}</span></div>
          </div>
        </div>

        {/* 🔘 TUS DOS BOTONES DE CONTROL EN PANTALLA */}
        <div className="no-print" style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={() => window.print()} className="btn-print">
            1. Imprimir / Guardar PDF
          </button>
          
          <button onClick={notificarYEnviarCorreo} className="btn-email" style={{ backgroundColor: "#28a745", color: "white" }}>
            2. Enviar PDF por Correo
          </button>
        </div>

      </div>
    </div>
  );
};

export default Comprobante;