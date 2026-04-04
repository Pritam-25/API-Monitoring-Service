import { AuthController } from '@auth/controllers/auth.controller.js';
import authRepository, {
  MongoUserRepository,
} from '@modules/auth/repositories/auth.repository.js';
import { AuthService } from '@modules/auth/services/auth.service.js';

type AuthDependencies = {
  repositories: {
    userRepository: MongoUserRepository;
  };
  services: {
    authService: AuthService;
  };
  controllers: {
    authController: AuthController;
  };
};

/**
 * Dependency Injection Container for the Auth module.
 */
class AuthContainer {
  static init(): AuthDependencies {
    const repositories = {
      userRepository: authRepository,
    };

    const services = {
      authService: new AuthService(repositories.userRepository),
    };

    const controllers = {
      authController: new AuthController(services.authService),
    };

    return {
      repositories,
      services,
      controllers,
    };
  }
}

const initialized = AuthContainer.init();

export { AuthContainer };
export default initialized;
