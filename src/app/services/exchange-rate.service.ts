import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface ConversionHistory {
  from: string;
  to: string;
  amount: number;
  result: number;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {
  private apiUrl = 'https://open.er-api.com/v6/latest/';

  constructor(private http: HttpClient) {}

  getRates(baseCurrency: string): Observable<any> {
    if (!navigator.onLine) {
      const cachedData = localStorage.getItem(`rates_${baseCurrency}`);
      if (cachedData) {
        return of(JSON.parse(cachedData));
      }
      return throwError(() => new Error('Você está offline e sem dados em cache.'));
    }

    return this.http.get(`${this.apiUrl}${baseCurrency}`).pipe(
      tap(data => {
        localStorage.setItem(`rates_${baseCurrency}`, JSON.stringify(data));
      }),
      catchError(error => {
        const cachedData = localStorage.getItem(`rates_${baseCurrency}`);
        if (cachedData) {
          return of(JSON.parse(cachedData));
        }
        return throwError(() => error);
      })
    );
  }

  getHistory(): ConversionHistory[] {
    const history = localStorage.getItem('conversion_history');
    return history ? JSON.parse(history) : [];
  }

  saveHistory(item: ConversionHistory): void {
    const history = this.getHistory();
    history.unshift(item);
    if (history.length > 20) history.pop();
    localStorage.setItem('conversion_history', JSON.stringify(history));
  }
}