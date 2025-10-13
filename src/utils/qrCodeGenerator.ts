import QRCode from 'qrcode';

export const generateAthleteQRCode = async (athleteId: string): Promise<string> => {
  const baseUrl = window.location.origin;
  const athleteUrl = `${baseUrl}/athlete-card/${athleteId}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(athleteUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};
