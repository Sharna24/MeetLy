import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminService } from '../services/admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardData();
  }

  @Patch('faculty/:id/verify')
  verifyFaculty(@Param('id') id: string) {
    return this.adminService.verifyFaculty(id);
  }

  @Patch('users/:id/suspend')
  suspendUser(@Param('id') id: string) {
    return this.adminService.setUserStatus(id, 'suspended');
  }

  @Patch('users/:id/restore')
  restoreUser(@Param('id') id: string) {
    return this.adminService.setUserStatus(id, 'active');
  }

  @Patch('reports/:id/resolve')
  resolveReport(@Param('id') id: string) {
    return this.adminService.resolveReport(id);
  }
}