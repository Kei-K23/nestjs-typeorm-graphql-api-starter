import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Role } from 'src/role/entities/role.entity';
import {
  Permission,
  PermissionType,
} from 'src/role/entities/permission.entity';
import { RolePermission } from 'src/role/entities/role-permission.entity';
import { User } from 'src/user/entities/user.entity';
import { AuthService } from 'src/auth/auth.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const ds = app.get(DataSource);
    const roleRepo = ds.getRepository(Role);
    const permRepo = ds.getRepository(Permission);
    const rolePermRepo = ds.getRepository(RolePermission);
    const userRepo = ds.getRepository(User);
    const authService = app.get(AuthService);

    const modules = ['User', 'Role', 'Activity_Log', 'Setting'];
    const actions = [
      PermissionType.CREATE,
      PermissionType.READ,
      PermissionType.UPDATE,
      PermissionType.DELETE,
    ];

    let superRole = await roleRepo.findOne({ where: { title: 'SUPERADMIN' } });
    if (!superRole) {
      superRole = roleRepo.create({
        title: 'SUPERADMIN',
        description: 'Full access',
      });
      superRole = await roleRepo.save(superRole);
    }

    const existingPerms = await permRepo.find();
    const existingKey = new Set(
      existingPerms.map((p) => `${p.module}:${p.permission}`),
    );
    const toCreate: Permission[] = [];
    for (const m of modules) {
      for (const a of actions) {
        const key = `${m}:${a}`;
        if (!existingKey.has(key)) {
          toCreate.push(
            permRepo.create({
              module: m,
              permission: a,
            }),
          );
        }
      }
    }
    if (toCreate.length) {
      await permRepo.save(toCreate);
    }

    const allPerms = await permRepo.find();
    const existingLinks = await rolePermRepo.find({
      where: { roleId: superRole.id },
    });
    const linkSet = new Set(
      existingLinks.map((rp) => `${rp.roleId}:${rp.permissionId}`),
    );
    const linkCreates: RolePermission[] = [];
    for (const p of allPerms) {
      const key = `${superRole.id}:${p.id}`;
      if (!linkSet.has(key)) {
        linkCreates.push(
          rolePermRepo.create({
            roleId: superRole.id,
            permissionId: p.id,
          }),
        );
      }
    }
    if (linkCreates.length) {
      await rolePermRepo.save(linkCreates);
    }

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminName = process.env.SEED_ADMIN_NAME || 'Super Admin';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

    let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      const hash = await authService.passwordHash(adminPassword);
      adminUser = userRepo.create({
        fullName: adminName,
        email: adminEmail,
        password: hash,
        roleId: superRole.id,
        isActive: true,
      });
      adminUser = await userRepo.save(adminUser);
    } else {
      if (!adminUser.roleId) {
        await userRepo.update(adminUser.id, { roleId: superRole.id });
      }
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

run();
