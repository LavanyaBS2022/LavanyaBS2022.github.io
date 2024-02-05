import { Component, ElementRef, ViewChild } from '@angular/core';
import { ApiService } from '../shared/services/api.service';
import { NgxSpinner, NgxSpinnerService } from 'ngx-spinner';
import { AlertController } from '@ionic/angular';  // Import AlertController from Ionic

interface Route {
  route_code: string;
  route_name: string;
}

interface Packet {
  packet_code: number;
  sent_qty: number;
  crates: number;
  ltrs_kgs: number;
}

@Component({
  selector: 'app-dispatch-details',
  templateUrl: './dispatch-details.page.html',
  styleUrls: ['./dispatch-details.page.scss'],
})
export class DispatchDetailsPage {
  routeOptions: Route[] = [];
  despatcherOptions: string = '';
  showDatePicker = false;
  selectedDate: string ='';
  showSecondAndThirdCards = false;
  selectedRoute: string | null = null;
  selectedDespatcherIncharge: string | null = null;
  accordionItemStates: boolean[] = [false, false, false];
  customerData: any[] = [];
  currentPanelIndex: number = -1; 
  showSaveButton: boolean = false; // New flag to control save button visibility
  savedPanels: Set<number> = new Set<number>();
  allPanelsSaved: boolean = false; // New property to track whether all panels are saved


  @ViewChild('datetimePicker') datetimePicker: any;

  
  tableHeaders: string[] = ['Item', 'qty', 'Crates', 'Ltr/Kg'];
  constructor(private apiService: ApiService,private spinner: NgxSpinnerService, private alertController: AlertController) {
    this.selectedDate = new Date().toISOString();
  }

  ngOnInit() {
    this.getRoute();
  }

getRoute() {
  this.apiService.getRequest('/master/route').subscribe((sResponse) => {
    this.routeOptions = sResponse.data.map((item: any) => {
      return {
        route_code: item.route_code,
        route_name: item.route_name,
      };
    });
    console.log("routes",sResponse)
  });
}

saveData() {
  debugger
  const gpNumbers = this.customerData.map(customer => customer.gp_number);
  const route_no = {
    gp_number: gpNumbers[0]
  };
  this.apiService.putRequest('/fgs/completeDispatch', route_no).subscribe((sResponse) => {
    console.log("response", sResponse);
  });
}


  openDatePicker() {
    this.showDatePicker = true;
    setTimeout(() => {
      this.datetimePicker.open();
    }, 0);
  }

  closeDatePicker() {
    this.showDatePicker = false;
  }

  onDateSelected(event: any) {
    console.log('Selected Date:', event.detail.value);
    this.selectedDate = event.detail.value;
    this.closeDatePicker();
  }

  allFieldsFilled(): boolean {
    return this.selectedDate !== null && this.selectedRoute !== null;
  }
  formatDate(date: string | Date): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) || '';
  }

  setPanelIndex(index: number) {
    this.currentPanelIndex = index;
  }
  isAccordionItemOpen(index: number): boolean {
    return this.accordionItemStates[index];
  }

  toggleAccordionItem(index: number) {
    this.accordionItemStates = this.accordionItemStates.map(() => false);
    this.accordionItemStates[index] = true;
    this.currentPanelIndex = index;
  }


  handleAccordionAction(action: 'next' | 'prev' | 'end', index: number) {
    switch (action) {
      case 'next':
        if (index < this.accordionItemStates.length - 1) {
          this.toggleAccordionItem(index + 1);
        }
        break;
      case 'prev':
        if (index > 0) {
          this.toggleAccordionItem(index - 1);
        }
        break;
      case 'end':
        this.closeAccordion(index);
        break;
    }
  }
  
  closeAccordion(index: number) {
      this.accordionItemStates[index] = false;  
    }

  isLastAccordionItem(index: number): boolean {
    return index === this.accordionItemStates.length - 1;
  }
  
  handleLoadButtonClick() {
    const formattedDate = (this.formatDate(this.selectedDate) || '')!;
    const routeCode = this.selectedRoute ? +this.selectedRoute : 0;
    this.loadData(formattedDate, routeCode);
  }

  loadData(pDate:string,route_code:number=0) {
    debugger
    this.spinner.show();
    setTimeout(() => {
      this.spinner.hide();
    }, 2000);
    this.showSecondAndThirdCards = true;
    this.apiService.getRequestbyParams('/fgs/routeDispatchDetails', pDate,route_code).subscribe((sResponse) => {
      this.customerData = sResponse.data;
      console.log("response", this.customerData);
    });
   } 
 
   savePanelData(indentNumber: number, customer: any): void {
      const updatedData = {
      indent_number: indentNumber,
      packets: customer.packets.map((packet: any) => ({
        packet_code: packet.packet_code,
        sent_qty:Number(packet.sent_qty) ,  // Bind sent_qty directly from the packet
        crates: Number( packet.crates),      // Bind crates directly from the packet
        ltrs_kgs: packet.ltrs_kgs
      }))
    };
    this.savedPanels.add(this.currentPanelIndex);
    this.checkAllPanelsSaved();
    this.apiService.putRequest('/fgs/dispatch',updatedData).subscribe((sResponse) => {
    });
    console.log(updatedData);
  }

  isPanelSaved(index: number): boolean {
    return this.savedPanels.has(index);
  }
    
  
  checkAllPanelsSaved(): void {
    this.allPanelsSaved = this.customerData.every((_, index) => this.savedPanels.has(index));
  }
}
