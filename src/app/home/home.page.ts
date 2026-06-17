import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ExchangeRateService, ConversionHistory } from '../services/exchange-rate.service';
import { addIcons } from 'ionicons';
import { swapHorizontalOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage implements OnInit {
  currencies = [
    { code: 'BRL', name: 'Real Brasileiro', flag: '🇧🇷' },
    { code: 'USD', name: 'Dólar Americano', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧' },
    { code: 'ARS', name: 'Peso Argentino', flag: '🇦🇷' },
    { code: 'JPY', name: 'Iene Japonês', flag: '🇯🇵' },
    { code: 'CAD', name: 'Dólar Canadense', flag: '🇨🇦' },
    { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺' },
    { code: 'CHF', name: 'Franco Suíço', flag: '🇨🇭' },
    { code: 'CNY', name: 'Yuán Chinês', flag: '🇨🇳' }
  ];
  fromCurrency: string = 'USD';
  toCurrency: string = 'BRL';
  amount: number = 1;
  result: number | null = null;
  rates: any = {};
  historyList: ConversionHistory[] = [];
  historicalVariation: { day: string; value: number }[] = [];
  updateFrequency: string = 'always';
  isOffline: boolean = false;

  constructor(
    private rateService: ExchangeRateService,
    private toastController: ToastController
  ) {
    addIcons({ swapHorizontalOutline });
  }

  ngOnInit() {
    this.checkConnection();
    this.loadRatesAndConvert();
    this.loadHistory();
    
    window.addEventListener('online', () => { this.isOffline = false; this.loadRatesAndConvert(); });
    window.addEventListener('offline', () => { this.isOffline = true; this.showToast('Modo offline ativado. Usando dados locais.'); });
  }

  checkConnection() {
    this.isOffline = !navigator.onLine;
  }

  loadHistory() {
    this.historyList = this.rateService.getHistory();
  }

  loadRatesAndConvert() {
    if (this.amount <= 0) return;

    this.rateService.getRates(this.fromCurrency).subscribe({
      next: (data) => {
        this.rates = data.rates;
        this.calculateConversion();
        this.generateHistoricalData();
      },
      error: async () => {
        await this.showToast('Erro ao obter taxas de câmbio. Verifique a conexão.');
      }
    });
  }

  calculateConversion() {
    if (this.rates && this.rates[this.toCurrency]) {
      const targetRate = this.rates[this.toCurrency];
      this.result = this.amount * targetRate;

      const historyItem: ConversionHistory = {
        from: this.fromCurrency,
        to: this.toCurrency,
        amount: this.amount,
        result: this.result,
        date: new Date().toLocaleTimeString()
      };
      this.rateService.saveHistory(historyItem);
      this.loadHistory();
    }
  }

  invertCurrencies() {
    const temp = this.fromCurrency;
    this.fromCurrency = this.toCurrency;
    this.toCurrency = temp;
    this.loadRatesAndConvert();
  }

  generateHistoricalData() {
    if (!this.rates[this.toCurrency]) return;
    const currentRate = this.rates[this.toCurrency];
    this.historicalVariation = [];
    
    for (let i = 4; i >= 1; i--) {
      const randomVariation = (Math.random() * 0.06) - 0.03;
      this.historicalVariation.push({
        day: `Há ${i * 7} dias`,
        value: currentRate * (1 + randomVariation)
      });
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}