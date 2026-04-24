import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export type UserListRow = { id: string; username: string; email: string; role: string; status: string };
export type ListUsersResponse = {
  data: UserListRow[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
};

export type BranchListRow = { id: string; name: string };
export type ListBranchesResponse = {
  data: BranchListRow[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
};

export type UserRoleFilter = 'Customer' | 'Manager' | 'Admin' | 'None';

@Injectable({ providedIn: 'root' })
export class AdminLookupApi {
  private readonly http = inject(HttpClient);

  listUsers(page: number, size: number, search?: string, role?: UserRoleFilter) {
    let params = new HttpParams().set('_page', String(page)).set('_size', String(size));
    if (search?.trim()) params = params.set('search', search.trim());
    if (role?.trim()) params = params.set('role', role.trim());
    return this.http.get<ListUsersResponse>('/api/Users', { params });
  }

  listBranches(page: number, size: number, search?: string) {
    let params = new HttpParams().set('_page', String(page)).set('_size', String(size));
    if (search?.trim()) params = params.set('search', search.trim());
    return this.http.get<ListBranchesResponse>('/api/Branches', { params });
  }

  /** Rótulo para exibição em autocomplete (cliente). */
  static formatUserLabel(u: UserListRow): string {
    return `${u.username} — ${u.email}`;
  }
}
