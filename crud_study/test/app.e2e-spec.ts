import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { Test } from "@nestjs/testing";
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from 'src/auth/dto';
import * as pactum from 'pactum';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
    }));
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email:"moll@gmail.com",
      password:"123456"
    }
    describe("Signup", () => {
      it("should throw if email empty", async () => {
        return pactum
        .spec()
        .post('/auth/signup').withBody({
          password:"123456"
        })
        .expectStatus(400)
      });
      it("should throw if password empty", async () => {
        return pactum
        .spec()
        .post('/auth/signup').withBody({
          email:"moll@gmail.com"
        })
        .expectStatus(400)
      });
      it("should throw if dto empty", async () => {
        return pactum
        .spec()
        .post('/auth/signup')
        .expectStatus(400)
      });
      it("should signup a user", async () => {
        return pactum
        .spec()
        .post('/auth/signup').withBody(dto)
        .expectStatus(201)
      });
    });

    describe("Signin", () => {
      it("should throw if email empty", async () => {
        return pactum
        .spec()
        .post('/auth/signin').withBody({
          password:"123456"
        })
        .expectStatus(400)
      });
      it("should throw if password empty", async () => {
        return pactum
        .spec()
        .post('/auth/signin').withBody({
          email:"moll@gmail.com"
        })
        .expectStatus(400)
      });
      it("should throw if dto empty", async () => {
        return pactum
        .spec()
        .post('/auth/signin')
        .expectStatus(400)
      });
      it("should signin a user", async () => {
        return pactum
        .spec()
        .post('/auth/signin').withBody(dto)
        .expectStatus(201)
        .stores('authToken', 'access_token')
      });
    });
  });

  describe('Users', () => {
    describe("Get me", () => {
      it("should get current user", async () => {
        return pactum
        .spec()
        .get('/users/me').withHeaders({
          Authorization: 'Bearer $S{authToken}'
        })
        .expectStatus(200)
      });
    });
    describe("Update user", () => {
      it("should edit user", async () => {
        const dto: EditUserDto = {
          firstName: "Moll",
          email: "moll@moll.com",
          lastName: ''
        }
        return pactum
        .spec()
        .patch('/users')
        .withHeaders({
          Authorization: 'Bearer $S{authToken}'
        })
        .withBody(dto)
        .expectStatus(200)
        .expectBodyContains(dto.firstName)
        .expectBodyContains(dto.email)
      });
    });
  });

  describe('Bookmarks', () => {
    describe("Get empty bookmarks", () => {
      it("should get bookmarks", async () => {
        return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{authToken}'
        })
        .expectStatus(200)
        .expectBody([])
      });
    });
    describe("Create bookmark", () => {
      const dto: CreateBookmarkDto = {
        link: "https://google.com",
        title: "Google",
        description: "Search engine"
      }
      it("should create bookmark", async () => {
        return pactum
        .spec()
        .post('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{authToken}'
        })
        .withBody(dto)
        .expectStatus(201)
        .stores('bookmarkId', 'id')
      });
    });
    describe("Get bookmarks", () => {
      it("should get bookmarks", async () => {
        return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{authToken}'
        })
        .expectStatus(200)
        .expectJsonLength(1)
      });
    });
    describe("Get bookmark by id", () => {
      it("should get bookmark by id", async () => {
        return pactum
        .spec()
        .get('/bookmarks/{id}')
        .withPathParams({
          id: '$S{bookmarkId}'
        })
        .withHeaders({
          Authorization: 'Bearer $S{authToken}'
        })
        .expectStatus(200)
        .expectBodyContains("$S{bookmarkId}")
      });
    });
    describe("Update bookmark", () => {
      it("should update bookmark by id", async () => {
        const dto: EditBookmarkDto = {
          title: "Google",
          description: "Search engine",
          link: "https://google.com"
        }
        return pactum
        .spec()
        .patch('/bookmarks/{id}')
        .withPathParams({
          id: '$S{bookmarkId}'
        })
        .withHeaders({
          Authorization: 'Bearer $S{authToken}'
        })
        .withBody(dto)
        .expectBodyContains(dto.title)
        .expectBodyContains(dto.description)
        .expectBodyContains(dto.link)
        .expectStatus(200)
      });
    });
    describe("Delete bookmark", () => {
      it("should delete bookmark", async () => {
        const dto: EditBookmarkDto = {
          title: "Google",
          description: "Search engine",
          link: "https://google.com"
        }
        return pactum
        .spec()
        .delete('/bookmarks/{id}')
        .withPathParams({
          id: '$S{bookmarkId}'
        })
        .withHeaders({
          Authorization: 'Bearer $S{authToken}'
        })
        .withBody(dto)
        .expectStatus(200)
      });
    });
  });
});	