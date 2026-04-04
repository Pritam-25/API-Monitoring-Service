import { ClientController } from '@client/controllers/client.controller.js';
import apiKeyRepository, {
  MongoApiKeyRepository,
} from '@client/repositories/apiKey.repository.js';
import clientRepository, {
  MongoClientRepository,
} from '@client/repositories/client.repository.js';
import { ClientService } from '@client/services/index.js';
import authContainer from '@modules/auth/container/auth.container.js';
import type { AuthService } from '@modules/auth/controllers/auth.controller.js';
import authRepository, {
  MongoUserRepository,
} from '@modules/auth/repositories/auth.repository.js';

type ClientDependencies = {
  repositories: {
    clientRepository: MongoClientRepository;
    apiKeyRepository: MongoApiKeyRepository;
    userRepository: MongoUserRepository;
  };
  services: {
    clientService: ClientService;
    authService: AuthService;
  };
  controllers: {
    clientController: ClientController;
  };
};

class ClientContainer {
  static init(): ClientDependencies {
    const repositories = {
      clientRepository,
      apiKeyRepository,
      userRepository: authRepository,
    };

    const services = {
      clientService: new ClientService(repositories),
      authService: authContainer.services.authService,
    };

    const controllers = {
      clientController: new ClientController(
        services.clientService,
        services.authService
      ),
    };

    return {
      repositories,
      services,
      controllers,
    };
  }
}

const initialized = ClientContainer.init();

export { ClientContainer };
export default initialized;
