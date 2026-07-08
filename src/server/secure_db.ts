import fs from 'fs';
import path from 'path';

// [Kelas]
export class SecureDatabase {
  private dbPath: string;
  private data: {
    galleryItems: any[];
    picketGroups: any[];
    picketAccounts: any[];
    picketReports: any[];
    inventory: any[];
    auditLogs: any[];
  };

  // [Konstruktor]
  constructor() {
    this.dbPath = path.join(process.cwd(), 'database.json');
    this.data = {
      galleryItems: [],
      picketGroups: [],
      picketAccounts: [],
      picketReports: [],
      inventory: [],
      auditLogs: []
    };
    this.initDatabase();
  }

  // [Inisialisasi]
  private initDatabase() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);

        this.data.galleryItems = Array.isArray(parsed.galleryItems) ? parsed.galleryItems : [];
        this.data.picketGroups = Array.isArray(parsed.picketGroups) ? parsed.picketGroups : [];
        this.data.picketAccounts = Array.isArray(parsed.picketAccounts) ? parsed.picketAccounts : [];
        this.data.picketReports = Array.isArray(parsed.picketReports) ? parsed.picketReports : [];
        this.data.inventory = Array.isArray(parsed.inventory) ? parsed.inventory : [];
        this.data.auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [];

        this.save();
        this.logSystem('Database loaded successfully from persistent storage.');
      } else {
        this.save();
        this.logSystem('Database initialized and seeded from local data templates.');
      }
    } catch (err) {
      console.error('Failed to initialize secure database:', err);
    }
  }

  // [Penyimpanan]
  private save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  private logSystem(message: string) {
    this.data.auditLogs.push({
      timestamp: new Date().toISOString(),
      type: 'SYSTEM',
      message
    });
    this.save();
  }

  // [Getter & Setter]
  public getGalleryItems() {
    return this.data.galleryItems;
  }

  public setGalleryItems(val: any[]) {
    this.data.galleryItems = val;
    this.save();
  }

  public getPicketGroups() {
    return this.data.picketGroups;
  }

  public setPicketGroups(val: any[]) {
    this.data.picketGroups = val;
    this.save();
  }

  public getPicketAccounts() {
    return this.data.picketAccounts;
  }

  public setPicketAccounts(val: any[]) {
    this.data.picketAccounts = val;
    this.save();
  }

  public getPicketReports() {
    return this.data.picketReports;
  }

  public setPicketReports(val: any[]) {
    this.data.picketReports = val;
    this.save();
  }

  public getInventory() {
    return this.data.inventory;
  }

  public setInventory(val: any[]) {
    this.data.inventory = val;
    this.save();
  }

  public getLogs(): any[] {
    return this.data.auditLogs;
  }
}

export const db = new SecureDatabase();
