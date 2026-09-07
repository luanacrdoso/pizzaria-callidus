function formatarCampo(id: string, valor: string) {
  const tamanho = valor.length.toString().padStart(2, '0');
  return `${id}${tamanho}${valor}`;
}

function removerAcentos(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// CRC16-CCITT, exigido pelo padrão do Banco Central pro "Pix copia e cola"
function crc16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function gerarPayloadPix({
  chave, nomeRecebedor, cidade = 'MANAUS', valor, txid = '***', descricao,
}: {
  chave: string;
  nomeRecebedor: string;
  cidade?: string;
  valor?: number;
  txid?: string;
  descricao?: string;
}): string {
  const chaveFormatada = chave.replace(/\s/g, '');

  let merchantInfo = formatarCampo('00', 'br.gov.bcb.pix') + formatarCampo('01', chaveFormatada);
  if (descricao) {
    merchantInfo += formatarCampo('02', removerAcentos(descricao).slice(0, 40));
  }

  const nome = removerAcentos(nomeRecebedor).toUpperCase().slice(0, 25);
  const cidadeFmt = removerAcentos(cidade).toUpperCase().slice(0, 15);

  let payload =
    formatarCampo('00', '01') +   // Payload Format Indicator
    formatarCampo('01', '11') +   // QR estático, reutilizável
    formatarCampo('26', merchantInfo) +
    formatarCampo('52', '0000') + // Categoria genérica
    formatarCampo('53', '986');   // Moeda: Real (BRL)

  if (valor && valor > 0) {
    payload += formatarCampo('54', valor.toFixed(2));
  }

  payload +=
    formatarCampo('58', 'BR') +
    formatarCampo('59', nome) +
    formatarCampo('60', cidadeFmt) +
    formatarCampo('62', formatarCampo('05', txid));

  payload += '6304'; // ID e tamanho do próprio CRC, que vem calculado a seguir
  return payload + crc16(payload);
}