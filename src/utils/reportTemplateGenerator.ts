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
    let y = 15;

    // Professional header background
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(15, y, 180, 50, 'F');
    
    // Decorative top border
    this.doc.setFillColor(8, 145, 178);
    this.doc.rect(15, y, 180, 3, 'F');

    // Logo (upper right corner, preserve original aspect ratio)
    if (this.logoImage && this.settings.report_include_logo) {
      const maxWidth = 35;
      const maxHeight = 35;
      const aspectRatio = this.logoImage.width / this.logoImage.height;
      
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      this.doc.addImage(this.logoImage, 'JPEG', 160 - width/2, y + 10, width, height);
    }

    // Club name (left side, prominent)
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(31, 31, 31);
    this.doc.text(this.clubInfo.club_name || 'Club Deportivo', 25, y + 25);

    // Subtitle/tagline
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(107, 114, 128);
    this.doc.text('Reporte Oficial', 25, y + 35);

    // Essential contact info (left side, below name)
    if (this.settings.report_include_contact) {
      const contact = this.clubInfo.contact_email || (this.clubInfo.contact_phone ?? '');
      if (contact) {
        this.doc.setFontSize(9);
        this.doc.setTextColor(75, 85, 99);
        this.doc.text(contact, 25, y + 45);
      }
    }
    
    return y + 70;
  }

  private generateCorporateHeader(): number {
    let y = 15;

    // Professional gradient background
    this.doc.setFillColor(239, 246, 255);
    this.doc.rect(15, y, 180, 65, 'F');
    
    // Top accent border
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(15, y, 180, 4, 'F');
    
    // Side accent
    this.doc.setFillColor(8, 145, 178);
    this.doc.rect(15, y, 4, 65, 'F');

    // Logo (upper right corner, preserve original aspect ratio)
    if (this.logoImage && this.settings.report_include_logo) {
      const maxWidth = 40;
      const maxHeight = 40;
      const aspectRatio = this.logoImage.width / this.logoImage.height;
      
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      this.doc.addImage(this.logoImage, 'JPEG', 165 - width/2, y + 15, width, height);
    }

    // Club name (centered, larger)
    this.doc.setFontSize(26);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(30, 58, 138);
    this.doc.text(this.clubInfo.club_name || 'Club Deportivo', 105, y + 30, { align: 'center' });

    // Professional subtitle
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(71, 85, 105);
    this.doc.text('Documento Oficial del Club', 105, y + 42, { align: 'center' });

    // Contact info line (centered)
    if (this.settings.report_include_contact || this.settings.report_include_address) {
      const contactInfo = [];
      if (this.settings.report_include_address && this.clubInfo.address) {
        contactInfo.push(this.clubInfo.address);
      }
      if (this.settings.report_include_contact && this.clubInfo.contact_phone) {
        contactInfo.push(`Tel: ${this.clubInfo.contact_phone}`);
      }
      if (this.settings.report_include_contact && this.clubInfo.contact_email) {
        contactInfo.push(this.clubInfo.contact_email);
      }
      
      if (contactInfo.length > 0) {
        this.doc.setFontSize(9);
        this.doc.setTextColor(100, 116, 139);
        this.doc.text(contactInfo.join(' • '), 105, y + 55, { align: 'center' });
      }
    }

    return y + 85;
  }

  private generateFullHeader(): number {
    let y = 15;

    // Premium header background with gradient effect
    this.doc.setFillColor(251, 253, 255);
    this.doc.rect(15, y, 180, 75, 'F');
    
    // Elegant top border
    this.doc.setFillColor(8, 145, 178);
    this.doc.rect(15, y, 180, 2, 'F');
    
    // Side decorative element
    this.doc.setFillColor(236, 254, 255);
    this.doc.rect(15, y + 2, 8, 73, 'F');

    // Logo (upper right corner, preserve original aspect ratio)
    if (this.logoImage && this.settings.report_include_logo) {
      // Professional logo frame
      const frameSize = 50;
      this.doc.setFillColor(255, 255, 255);
      this.doc.rect(145, y + 8, frameSize, frameSize, 'F');
      this.doc.setDrawColor(229, 231, 235);
      this.doc.rect(145, y + 8, frameSize, frameSize, 'S');
      
      // Calculate logo dimensions preserving aspect ratio
      const maxWidth = 40;
      const maxHeight = 40;
      const aspectRatio = this.logoImage.width / this.logoImage.height;
      
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      // Center logo in frame
      const logoX = 145 + (frameSize - width) / 2;
      const logoY = y + 8 + (frameSize - height) / 2;
      this.doc.addImage(this.logoImage, 'JPEG', logoX, logoY, width, height);
    }

    // Club name (left side, prominent)
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(this.clubInfo.club_name || 'Club Deportivo', 30, y + 30);

    // Professional tagline
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(8, 145, 178);
    this.doc.text('Reporte Oficial y Confidencial', 30, y + 45);

    // Contact information section (organized professionally with proper spacing)
    let infoY = y + 60;
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(71, 85, 105);

    const maxWidth = (this.logoImage && this.settings.report_include_logo) ? 120 : 160;
    
    if (this.settings.report_include_address && this.clubInfo.address) {
      this.doc.text(`Direccion: ${this.clubInfo.address}`, 30, infoY);
      infoY += 7;
    }
    if (this.settings.report_include_contact && this.clubInfo.contact_phone) {
      this.doc.text(`Telefono: ${this.clubInfo.contact_phone}`, 30, infoY);
      infoY += 7;
    }
    if (this.settings.report_include_contact && this.clubInfo.contact_email) {
      this.doc.text(`Email: ${this.clubInfo.contact_email}`, 30, infoY);
      infoY += 7;
    }
    if (this.settings.report_include_contact && this.clubInfo.website_url) {
      this.doc.text(`Web: ${this.clubInfo.website_url}`, 30, infoY);
      infoY += 7;
    }

    // League information (if enabled)
    if (this.settings.report_include_league && this.clubInfo.league) {
      this.doc.text(`Liga: ${this.clubInfo.league}`, 30, infoY);
      infoY += 7;
    }

    // Social media (if enabled)
    if (this.settings.report_include_social) {
      const social = [];
      if (this.clubInfo.social_facebook) social.push(`Facebook`);
      if (this.clubInfo.social_instagram) social.push(`Instagram`);
      if (this.clubInfo.social_twitter) social.push(`Twitter`);
      
      if (social.length > 0) {
        this.doc.text(`Redes Sociales: ${social.join(', ')}`, 30, infoY);
      }
    }

    return infoY + 15;
  }

  generateFooter(pageHeight: number = 297): void {
    const footerY = pageHeight - 45;
    
    // Professional footer background
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(15, footerY - 5, 180, 40, 'F');
    
    // Top accent line
    this.doc.setFillColor(8, 145, 178);
    this.doc.rect(15, footerY - 5, 180, 2, 'F');

    let y = footerY + 3;
    
    // Club contact information section (comprehensive as requested)
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(31, 31, 31);
    this.doc.text(this.clubInfo.club_name || 'Club Deportivo', 20, y);
    
    y += 6;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99);
    
    // Contact information with proper spacing
    if (this.settings.report_include_address && this.clubInfo.address) {
      this.doc.text(`Direccion: ${this.clubInfo.address}`, 20, y);
      y += 6;
    }
    
    if (this.settings.report_include_contact) {
      if (this.clubInfo.contact_phone) {
        this.doc.text(`Telefono: ${this.clubInfo.contact_phone}`, 20, y);
        y += 6;
      }
      if (this.clubInfo.contact_email) {
        this.doc.text(`Email: ${this.clubInfo.contact_email}`, 20, y);
        y += 6;
      }
      if (this.clubInfo.website_url) {
        this.doc.text(`Web: ${this.clubInfo.website_url}`, 20, y);
        y += 6;
      }
    }
    
    // League information
    if (this.settings.report_include_league && this.clubInfo.league) {
      const leagueText = this.clubInfo.country 
        ? `Liga: ${this.clubInfo.league} - ${this.clubInfo.country}`
        : `Liga: ${this.clubInfo.league}`;
      this.doc.text(leagueText, 20, y);
      y += 6;
    }

    // Right side - Date, page and president signature
    const rightX = 120;
    let rightY = footerY + 3;
    
    // Generation date
    const date = new Date().toLocaleDateString('es-ES');
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    this.doc.setFontSize(8);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(`Generado el ${date} a las ${time}`, 190, rightY, { align: 'right' });
    
    // President signature section (if enabled and improved)
    if (this.settings.report_include_president && this.clubInfo.president_name) {
      rightY += 8;
      this.doc.setFontSize(8);
      this.doc.setTextColor(31, 31, 31);
      
      // Signature line
      this.doc.setDrawColor(107, 114, 128);
      this.doc.line(rightX, rightY, 185, rightY);
      
      // President info
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.clubInfo.president_name, rightX + 32, rightY + 6, { align: 'center' });
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.setTextColor(107, 114, 128);
      this.doc.text('Presidente del Club', rightX + 32, rightY + 12, { align: 'center' });
      
      if (this.clubInfo.president_email) {
        this.doc.text(this.clubInfo.president_email, rightX + 32, rightY + 17, { align: 'center' });
      }
    }
    
    // Document authenticity footer
    this.doc.setFontSize(6);
    this.doc.setTextColor(156, 163, 175);
    this.doc.text('Este documento es oficial y confidencial del club deportivo', 105, pageHeight - 8, { align: 'center' });
  }

  addSpace(amount: number = 10): number {
    this.currentY += amount;
    return this.currentY;
  }

  addTitle(title: string, fontSize: number = 16): number {
    // Professional title styling
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(15, 23, 42);
    
    // Add subtle background for title
    if (fontSize >= 16) {
      this.doc.setFillColor(239, 246, 255);
      this.doc.rect(18, this.currentY - 6, 174, fontSize + 4, 'F');
      
      // Accent border
      this.doc.setFillColor(8, 145, 178);
      this.doc.rect(18, this.currentY - 6, 4, fontSize + 4, 'F');
    }
    
    this.doc.text(title, 25, this.currentY);
    this.currentY += fontSize * 1.2;
    return this.currentY;
  }

  addText(text: string, fontSize: number = 10, x: number = 20): number {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(55, 65, 81);
    this.doc.text(text, x, this.currentY);
    this.currentY += fontSize * 0.8;
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
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; position: relative; border-top: 4px solid #0891b2;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: bold; color: #0f172a;">${clubInfo.club_name || 'Club Deportivo'}</h1>
              <p style="margin: 0; font-size: 14px; color: #0891b2; font-weight: 500;">Reporte Oficial</p>
              ${settings.report_include_contact && (clubInfo.contact_email || clubInfo.contact_phone) ? 
                `<p style="margin: 8px 0 0 0; font-size: 12px; color: #475569;">${clubInfo.contact_email || clubInfo.contact_phone}</p>` : ''}
            </div>
            ${settings.report_include_logo && clubInfo.club_logo_url ? 
              `<div style="background: white; padding: 8px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                 <img src="${clubInfo.club_logo_url}" alt="Club Logo" style="width: 60px; height: 60px; object-fit: contain;" />
               </div>` : ''}
          </div>
        </div>
      `;
    
    case 'corporate':
      return `
        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 30px; position: relative; border-top: 6px solid #3b82f6;">
          ${settings.report_include_logo && clubInfo.club_logo_url ? 
            `<div style="background: white; width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
               <img src="${clubInfo.club_logo_url}" alt="Club Logo" style="width: 60px; height: 60px; object-fit: contain;" />
             </div>` : ''}
          <h1 style="margin: 0 0 8px 0; font-size: 36px; font-weight: bold; color: #1e40af;">${clubInfo.club_name || 'Club Deportivo'}</h1>
          <p style="margin: 0 0 15px 0; font-size: 16px; color: #0891b2; font-weight: 500;">Documento Oficial del Club</p>
          ${(settings.report_include_contact || settings.report_include_address) ? 
            `<div style="font-size: 14px; color: #64748b; line-height: 1.6;">
               ${[
                 settings.report_include_address && clubInfo.address ? `Direccion: ${clubInfo.address}` : '',
                 settings.report_include_contact && clubInfo.contact_phone ? `Tel: ${clubInfo.contact_phone}` : '',
                 settings.report_include_contact && clubInfo.contact_email ? `Email: ${clubInfo.contact_email}` : ''
               ].filter(Boolean).join(' • ')}
             </div>` : ''}
        </div>
      `;
    
    default: // full
      return `
        <div style="background: linear-gradient(135deg, #fbfcff 0%, #f1f5f9 100%); padding: 35px; border-radius: 12px; margin-bottom: 30px; position: relative; border-left: 8px solid #0891b2; border-top: 2px solid #0891b2;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between;">
            <div style="flex: 1; max-width: 65%;">
              <h1 style="margin: 0 0 12px 0; font-size: 38px; font-weight: bold; color: #0f172a;">${clubInfo.club_name || 'Club Deportivo'}</h1>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #0891b2; font-weight: 500;">Reporte Oficial y Confidencial</p>
              <div style="font-size: 14px; color: #475569; line-height: 1.8;">
                ${settings.report_include_address && clubInfo.address ? `<div style="margin-bottom: 6px;"><strong style="color: #334155;">Direccion:</strong> ${clubInfo.address}</div>` : ''}
                ${settings.report_include_contact && clubInfo.contact_phone ? `<div style="margin-bottom: 6px;"><strong style="color: #334155;">Telefono:</strong> ${clubInfo.contact_phone}</div>` : ''}
                ${settings.report_include_contact && clubInfo.contact_email ? `<div style="margin-bottom: 6px;"><strong style="color: #334155;">Email:</strong> ${clubInfo.contact_email}</div>` : ''}
                ${settings.report_include_contact && clubInfo.website_url ? `<div style="margin-bottom: 6px;"><strong style="color: #334155;">Web:</strong> ${clubInfo.website_url}</div>` : ''}
                ${settings.report_include_league && clubInfo.league ? `<div style="margin-bottom: 6px;"><strong style="color: #334155;">Liga:</strong> ${clubInfo.league}</div>` : ''}
                ${settings.report_include_social && (clubInfo.social_facebook || clubInfo.social_instagram || clubInfo.social_twitter) ? 
                  `<div><strong style="color: #334155;">Redes Sociales:</strong> ${[
                    clubInfo.social_facebook ? `Facebook` : '',
                    clubInfo.social_instagram ? `Instagram` : '',
                    clubInfo.social_twitter ? `Twitter` : ''
                  ].filter(Boolean).join(', ')}</div>` : ''}
              </div>
            </div>
            ${settings.report_include_logo && clubInfo.club_logo_url ? 
              `<div style="background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 2px solid #e2e8f0;">
                 <img src="${clubInfo.club_logo_url}" alt="Club Logo" style="width: 80px; height: 80px; object-fit: contain;" />
               </div>` : ''}
          </div>
        </div>
      `;
  }
}

function generateFooterHTML(clubInfo: ClubInfo, settings: ReportSettings): string {
  return `
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; margin-top: 40px; border-top: 3px solid #0891b2;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 14px; color: #1f2937; margin-bottom: 8px;">${clubInfo.club_name || 'Club Deportivo'}</div>
          <div style="font-size: 12px; color: #6b7280; line-height: 1.6;">
            ${settings.report_include_address && clubInfo.address ? `<div style="margin-bottom: 4px;">Direccion: ${clubInfo.address}</div>` : ''}
            ${settings.report_include_contact && clubInfo.contact_phone ? `<div style="margin-bottom: 4px;">Telefono: ${clubInfo.contact_phone}</div>` : ''}
            ${settings.report_include_contact && clubInfo.contact_email ? `<div style="margin-bottom: 4px;">Email: ${clubInfo.contact_email}</div>` : ''}
            ${settings.report_include_contact && clubInfo.website_url ? `<div style="margin-bottom: 4px;">Web: ${clubInfo.website_url}</div>` : ''}
            ${settings.report_include_league && clubInfo.league ? `<div>Liga: ${clubInfo.league}</div>` : ''}
          </div>
        </div>
        <div style="text-align: right; flex-shrink: 0; margin-left: 30px;">
          ${settings.report_include_president && clubInfo.president_name ? 
            `<div style="margin-bottom: 20px; text-align: center;">
              <div style="border-bottom: 2px solid #374151; width: 180px; margin-bottom: 8px;"></div>
              <div style="font-size: 13px; font-weight: bold; color: #1f2937;">${clubInfo.president_name}</div>
              <div style="font-size: 11px; color: #6b7280;">Presidente del Club</div>
              ${clubInfo.president_email ? `<div style="font-size: 10px; color: #9ca3af; margin-top: 2px;">${clubInfo.president_email}</div>` : ''}
            </div>` : ''}
          <div style="font-size: 11px; color: #9ca3af;">
            <div>Generado el ${new Date().toLocaleDateString('es-ES')}</div>
            <div style="margin-top: 2px;">a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1d5db;">
        <div style="font-size: 10px; color: #9ca3af; font-style: italic;">
          Este documento es oficial y confidencial del club deportivo
        </div>
      </div>
    </div>
  `;
}