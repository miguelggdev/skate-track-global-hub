import jsPDF from 'jspdf';

export interface ClubInfo {
  club_name?: string;
  club_logo_url?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_twitter?: string;
  president_name?: string;
  president_phone?: string;
  president_email?: string;
  delegate_name?: string;
  delegate_phone?: string;
  delegate_email?: string;
  league?: string;
  country?: string;
}

export interface ReportSettings {
  report_include_logo?: boolean;
  report_include_address?: boolean;
  report_include_contact?: boolean;
  report_include_social?: boolean;
  report_include_president?: boolean;
  report_include_delegate?: boolean;
  report_include_league?: boolean;
  report_header_style?: 'minimal' | 'full' | 'corporate';
}

export class ReportTemplateGenerator {
  private doc: jsPDF;
  private clubInfo: ClubInfo;
  private settings: ReportSettings;
  private logoImage?: HTMLImageElement;
  private currentY: number = 20;

  constructor(doc: jsPDF, clubInfo: ClubInfo, settings: ReportSettings) {
    this.doc = doc;
    this.clubInfo = clubInfo;
    this.settings = settings;
  }

  async loadLogo(): Promise<void> {
    if (!this.settings.report_include_logo || !this.clubInfo.club_logo_url) {
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.logoImage = img;
        resolve();
      };
      img.onerror = () => resolve(); // Continue without logo if it fails to load
      img.src = this.clubInfo.club_logo_url!;
    });
  }

  generateHeader(): number {
    const style = this.settings.report_header_style || 'full';
    
    switch (style) {
      case 'minimal':
        return this.generateMinimalHeader();
      case 'corporate':
        return this.generateCorporateHeader();
      default:
        return this.generateFullHeader();
    }
  }

  private generateMinimalHeader(): number {
    let y = 20;

    // Logo (small, left aligned)
    if (this.logoImage && this.settings.report_include_logo) {
      this.doc.addImage(this.logoImage, 'JPEG', 20, y, 30, 30);
    }

    // Club name (next to logo or left aligned if no logo)
    const nameX = (this.logoImage && this.settings.report_include_logo) ? 60 : 20;
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.clubInfo.club_name || 'Club Deportivo', nameX, y + 15);

    // Essential contact (same line, right aligned)
    if (this.settings.report_include_contact) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      const contact = this.clubInfo.contact_email || this.clubInfo.contact_phone || '';
      if (contact) {
        this.doc.text(contact, 190, y + 15, { align: 'right' });
      }
    }

    // Line separator
    y += 40;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(20, y, 190, y);
    
    return y + 10;
  }

  private generateCorporateHeader(): number {
    let y = 20;

    // Header background (light gray)
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(20, y, 170, 50, 'F');

    // Logo (centered top)
    if (this.logoImage && this.settings.report_include_logo) {
      this.doc.addImage(this.logoImage, 'JPEG', 95, y + 5, 20, 20);
      y += 30;
    }

    // Club name (centered)
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.clubInfo.club_name || 'Club Deportivo', 105, y, { align: 'center' });

    // Contact info (centered, smaller)
    if (this.settings.report_include_contact || this.settings.report_include_address) {
      y += 8;
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      
      const contactInfo = [];
      if (this.settings.report_include_address && this.clubInfo.address) {
        contactInfo.push(this.clubInfo.address);
      }
      if (this.settings.report_include_contact && this.clubInfo.contact_phone) {
        contactInfo.push(this.clubInfo.contact_phone);
      }
      if (this.settings.report_include_contact && this.clubInfo.contact_email) {
        contactInfo.push(this.clubInfo.contact_email);
      }
      
      if (contactInfo.length > 0) {
        this.doc.text(contactInfo.join(' | '), 105, y, { align: 'center' });
      }
    }

    return 80;
  }

  private generateFullHeader(): number {
    let y = 20;

    // Logo (left side, larger)
    if (this.logoImage && this.settings.report_include_logo) {
      this.doc.addImage(this.logoImage, 'JPEG', 20, y, 40, 40);
    }

    // Club info (right side)
    const infoX = (this.logoImage && this.settings.report_include_logo) ? 70 : 20;
    
    // Club name
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.clubInfo.club_name || 'Club Deportivo', infoX, y + 15);

    y += 25;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    // Address
    if (this.settings.report_include_address && this.clubInfo.address) {
      this.doc.text(`Dirección: ${this.clubInfo.address}`, infoX, y);
      y += 6;
    }

    // Contact info
    if (this.settings.report_include_contact) {
      if (this.clubInfo.contact_phone) {
        this.doc.text(`Teléfono: ${this.clubInfo.contact_phone}`, infoX, y);
        y += 6;
      }
      if (this.clubInfo.contact_email) {
        this.doc.text(`Email: ${this.clubInfo.contact_email}`, infoX, y);
        y += 6;
      }
      if (this.clubInfo.website_url) {
        this.doc.text(`Web: ${this.clubInfo.website_url}`, infoX, y);
        y += 6;
      }
    }

    // League info
    if (this.settings.report_include_league && this.clubInfo.league) {
      this.doc.text(`Liga: ${this.clubInfo.league}`, infoX, y);
      y += 6;
    }

    // Social media
    if (this.settings.report_include_social) {
      const social = [];
      if (this.clubInfo.social_facebook) social.push(`FB: ${this.clubInfo.social_facebook}`);
      if (this.clubInfo.social_instagram) social.push(`IG: ${this.clubInfo.social_instagram}`);
      if (this.clubInfo.social_twitter) social.push(`TW: ${this.clubInfo.social_twitter}`);
      
      if (social.length > 0) {
        this.doc.text(`Redes: ${social.join(' | ')}`, infoX, y);
        y += 6;
      }
    }

    // Separator line
    const finalY = Math.max(y, (this.logoImage && this.settings.report_include_logo) ? 70 : 50);
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(20, finalY, 190, finalY);

    return finalY + 10;
  }

  generateFooter(pageHeight: number = 297): void {
    const footerY = pageHeight - 30;
    
    // Footer line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(20, footerY, 190, footerY);

    let y = footerY + 8;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');

    // Left side - Club name and basic info
    this.doc.text(this.clubInfo.club_name || 'Club Deportivo', 20, y);
    if (this.settings.report_include_contact && this.clubInfo.contact_email) {
      this.doc.text(this.clubInfo.contact_email, 20, y + 4);
    }

    // Right side - Date and page
    const date = new Date().toLocaleDateString('es-ES');
    this.doc.text(`Generado el ${date}`, 190, y, { align: 'right' });
    
    // President signature section (if enabled)
    if (this.settings.report_include_president && this.clubInfo.president_name) {
      const sigY = footerY - 40;
      this.doc.setFontSize(10);
      this.doc.text('_________________________', 140, sigY);
      this.doc.text(this.clubInfo.president_name, 140, sigY + 8);
      this.doc.text('Presidente', 140, sigY + 14);
    }
  }

  addSpace(amount: number = 10): number {
    this.currentY += amount;
    return this.currentY;
  }

  addTitle(title: string, fontSize: number = 16): number {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, 20, this.currentY);
    this.currentY += fontSize * 0.8;
    return this.currentY;
  }

  addText(text: string, fontSize: number = 10, x: number = 20): number {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(text, x, this.currentY);
    this.currentY += fontSize * 0.6;
    return this.currentY;
  }

  getCurrentY(): number {
    return this.currentY;
  }

  setCurrentY(y: number): void {
    this.currentY = y;
  }
}

// Utility function to generate HTML template for html2canvas reports
export function generateHTMLTemplate(
  clubInfo: ClubInfo, 
  settings: ReportSettings, 
  content: string
): string {
  const style = settings.report_header_style || 'full';
  
  const headerHTML = generateHeaderHTML(clubInfo, settings, style);
  const footerHTML = generateFooterHTML(clubInfo, settings);

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; background: white; padding: 40px;">
      ${headerHTML}
      <div style="margin: 30px 0;">
        ${content}
      </div>
      ${footerHTML}
    </div>
  `;
}

function generateHeaderHTML(clubInfo: ClubInfo, settings: ReportSettings, style: string): string {
  switch (style) {
    case 'minimal':
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 30px;">
          <div style="display: flex; align-items: center;">
            ${settings.report_include_logo && clubInfo.club_logo_url ? 
              `<img src="${clubInfo.club_logo_url}" alt="Club Logo" style="width: 40px; height: 40px; margin-right: 15px; object-fit: contain;" />` : ''}
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1a1a1a;">${clubInfo.club_name || 'Club Deportivo'}</h1>
          </div>
          ${settings.report_include_contact ? 
            `<div style="font-size: 14px; color: #666;">${clubInfo.contact_email || clubInfo.contact_phone || ''}</div>` : ''}
        </div>
      `;
    
    case 'corporate':
      return `
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
          ${settings.report_include_logo && clubInfo.club_logo_url ? 
            `<img src="${clubInfo.club_logo_url}" alt="Club Logo" style="width: 60px; height: 60px; margin-bottom: 15px; object-fit: contain;" />` : ''}
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold; color: #1a1a1a;">${clubInfo.club_name || 'Club Deportivo'}</h1>
          ${(settings.report_include_contact || settings.report_include_address) ? 
            `<div style="font-size: 14px; color: #666;">
              ${[
                settings.report_include_address && clubInfo.address ? clubInfo.address : '',
                settings.report_include_contact && clubInfo.contact_phone ? clubInfo.contact_phone : '',
                settings.report_include_contact && clubInfo.contact_email ? clubInfo.contact_email : ''
              ].filter(Boolean).join(' | ')}
            </div>` : ''}
        </div>
      `;
    
    default: // full
      return `
        <div style="display: flex; align-items: flex-start; border-bottom: 2px solid #e5e5e5; padding-bottom: 25px; margin-bottom: 30px;">
          ${settings.report_include_logo && clubInfo.club_logo_url ? 
            `<img src="${clubInfo.club_logo_url}" alt="Club Logo" style="width: 80px; height: 80px; margin-right: 30px; object-fit: contain;" />` : ''}
          <div style="flex: 1;">
            <h1 style="margin: 0 0 15px 0; font-size: 32px; font-weight: bold; color: #1a1a1a;">${clubInfo.club_name || 'Club Deportivo'}</h1>
            <div style="font-size: 14px; color: #666; line-height: 1.6;">
              ${settings.report_include_address && clubInfo.address ? `<div><strong>Dirección:</strong> ${clubInfo.address}</div>` : ''}
              ${settings.report_include_contact && clubInfo.contact_phone ? `<div><strong>Teléfono:</strong> ${clubInfo.contact_phone}</div>` : ''}
              ${settings.report_include_contact && clubInfo.contact_email ? `<div><strong>Email:</strong> ${clubInfo.contact_email}</div>` : ''}
              ${settings.report_include_contact && clubInfo.website_url ? `<div><strong>Web:</strong> ${clubInfo.website_url}</div>` : ''}
              ${settings.report_include_league && clubInfo.league ? `<div><strong>Liga:</strong> ${clubInfo.league}</div>` : ''}
              ${settings.report_include_social && (clubInfo.social_facebook || clubInfo.social_instagram || clubInfo.social_twitter) ? 
                `<div><strong>Redes:</strong> ${[
                  clubInfo.social_facebook ? `FB: ${clubInfo.social_facebook}` : '',
                  clubInfo.social_instagram ? `IG: ${clubInfo.social_instagram}` : '',
                  clubInfo.social_twitter ? `TW: ${clubInfo.social_twitter}` : ''
                ].filter(Boolean).join(' | ')}</div>` : ''}
            </div>
          </div>
        </div>
      `;
  }
}

function generateFooterHTML(clubInfo: ClubInfo, settings: ReportSettings): string {
  return `
    <div style="border-top: 2px solid #e5e5e5; padding-top: 20px; margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div style="font-size: 12px; color: #666;">
        <div style="font-weight: bold;">${clubInfo.club_name || 'Club Deportivo'}</div>
        ${settings.report_include_contact && clubInfo.contact_email ? `<div>${clubInfo.contact_email}</div>` : ''}
      </div>
      <div style="text-align: right;">
        ${settings.report_include_president && clubInfo.president_name ? 
          `<div style="margin-bottom: 30px;">
            <div style="border-bottom: 1px solid #333; width: 200px; margin-bottom: 5px;"></div>
            <div style="font-size: 12px; font-weight: bold;">${clubInfo.president_name}</div>
            <div style="font-size: 10px; color: #666;">Presidente</div>
          </div>` : ''}
        <div style="font-size: 10px; color: #666;">Generado el ${new Date().toLocaleDateString('es-ES')}</div>
      </div>
    </div>
  `;
}