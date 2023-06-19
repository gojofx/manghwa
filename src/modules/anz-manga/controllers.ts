import express from "express";
const { anzManga } = require("../../util/pages.json") 
const request = require('request');

const cheerio = require('cheerio');
const axios = require('axios')
const fs = require('fs');
const AdmZip = require('adm-zip');
const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');
const sharp = require('sharp');
const archiver = require('archiver');
const { Readable } = require('stream');


export const router = express.Router();

export const root = async function (
  req: express.Request,
  res: express.Response
): Promise<any> {
  try {
    const responseMessage = 
      "You are in the section that queries mangas and manhwas " +
      `of the website ${anzManga} the endpoints` +
      "that you can use and your answers will be displayed below."+
      "read Documentation API in https://github.com/gojofx/manghwa";

    res.json({
      responseMessage,
    })

  } catch (error) {
    res.json({
      responseCode: 500,
      responseMessage: error,
      responseData: req.query
    })
  }
}

export const findByName = async function (
  req: express.Request,
  res: express.Response
): Promise<any> {
  try {
    const name = req.query?.name

    interface Response {
      suggestions: Search[];
    }

    interface Search {
      value: string;
      data: string;
    }

    await axios.get(`${anzManga}/search?query=${name}`)
      .then((response: any) => {
        const suggestions: Response = response.data
        res.json({
          responseCode: 200,
          responseMessage: "correctly collected data",
          responseData: suggestions
        })
      })
      .catch((error: any) => {
        res.json({
          responseCode: 403,
          responseMessage: error.message,
          responseData: error.config.url
        })
        console.log(error)
      })


  } catch (error) {
    res.json({
      responseCode: 500,
      responseMessage: error,
      responseData: req.query
    })
  }
}

export const findChaptersByName = async function (
  req: express.Request,
  res: express.Response
): Promise<any> {
  try {
    const name: any = req.query?.name
    const baseurl: any = req.get('host')

    await getChaptersUrl(name, baseurl, req.protocol)
      .then((response: any) => {
        const suggestions: Response = response.data
        res.json({
          responseCode: 200,
          responseMessage: "correctly collected data",
          responseData: suggestions
        })
      })
      .catch((error: any) => {
        res.json({
          responseCode: 403,
          responseMessage: error.message,
          responseData: error.config.url
        })
        console.log(error)
      })


  } catch (error) {
    res.json({
      responseCode: 500,
      responseMessage: error,
      responseData: req.query
    })
  }
}

export const findImagesChapter = async function (
  req: express.Request,
  res: express.Response
): Promise<any> {
  try {
    const name: any = req.query?.name
    let chapter: any = req.query?.chapter

    await getUrlImagesByChapter({ name, chapter, req })
      .then((response: any) => {
        res.json({
          responseCode: 200,
          responseMessage: "correctly collected data",
          responseData: response
        })
      })
      .catch((error: any) => {
        res.json({
          responseCode: 403,
          responseMessage: error.message,
          responseData: error.config.url
        })
        console.log(error)
      })


  } catch (error) {
    res.json({
      responseCode: 500,
      responseMessage: error,
      responseData: req.query
    })
  }
}

export const downloadChapterPdf = async function (
  req: express.Request,
  res: express.Response
): Promise<any> {
  try {
    const name: any = req.query?.name
    let chapter: any = req.query?.chapter

    interface Response {
      urlImages: string[];
      chapter: string;
      name: string;
      search: string;
    }

    await getUrlImagesByChapter({ name, chapter, req })
      .then(async (response: Response) => {
        const doc = new PDFDocument();

        await createPDFByBuffer(name, chapter, doc, response.urlImages)

        res.attachment(`${name}-${chapter}.pdf`)
        doc.pipe(res);
        doc.end();

        console.log('PDF file was successfully created');
      })
      .catch((error: any) => {
        res.json({
          responseCode: 403,
          responseMessage: error.message,
          responseData: error.config.url
        })
        console.log(error)
      })
  } catch (error) {
    res.json({
      responseCode: 500,
      responseMessage: error,
      responseData: req.query
    })
  }
}

export const generateZip = async function (
  req: express.Request,
  res: express.Response
): Promise<any> {
  try {
    const name: any = req.query?.name
    let chapter: any = req.query?.chapter
    interface Response {
      urlImages: string[];
      chapter: string;
      name: string;
      search: string;
    }

    await getUrlImagesByChapter({ name, chapter, req })
      .then(async (response: Response) => {

        const imageBuffers: any[] = await getBufferImagesByUrl(response.urlImages);
        const outputPath = `${name}-${chapter}.zip`;

        const archive = archiver('zip', {
          zlib: { level: 9 },
        });

        const zipData: any[] = [];

        archive.on('data', (data: any) => {
          zipData.push(data);
        });

        archive.on('error', (err: any) => {
          console.error('Error while archiving:', err);
          res.status(500).send('Internal Server Error');
        });

        archive.on('end', () => {
          const zipBuffer = Buffer.concat(zipData);
          const stream = new Readable();
          stream.push(zipBuffer);
          stream.push(null);
        
          res.set('Content-Type', 'application/zip');
          res.set('Content-Disposition', `attachment; filename=${outputPath}`);
          stream.pipe(res);
        });

        imageBuffers.forEach((image, index) => {
          archive.append(Buffer.from(image.data), { name: `image-${index + 1}.jpg` });
        });
        
        archive.finalize();
      })
      .catch((error: any) => {
        res.json({
          responseCode: 403,
          responseMessage: error.message,
          responseData: error.config.url
        })
        console.log(error)
      })

  } catch (error) {
    res.json({
      responseCode: 500,
      responseMessage: error,
      responseData: req.query
    })
  }
}



async function getChaptersUrl(search: string, baseurl: string, protocol: string) {
  return new Promise((resolve, reject) => {
    const url = `${anzManga}/manga/${search}`
    request(url, (err: any, res2: any, body: any) => {
      if (!err && res2.statusCode == 200) {
        const $ = cheerio.load(body);
        let chapters: any[] = [];

        $('ul.chapters > li > h5 > a').each(function (this: HTMLElement) {
          const urlChapters: string[] = $(this).attr('href').split('/');

          interface Chapter {
            chapter: string;
            url: string;
          }

          let chapter: Chapter = {
            chapter: "",
            url: "",
          };

          urlChapters.forEach(() => {
            const chapterNumber = urlChapters[urlChapters.length - 1];
            chapter = {
              chapter: chapterNumber,
              url: ` ${protocol}://${baseurl}/api/anzmanga/findImagesChapter?name=${search}&chapter=${chapterNumber} `
            }
          })

          chapters.push(chapter);

        });

        const response = {
          data: chapters
        };

        resolve(response);
      } else {
        reject(err);
      }
    })

  });
}
async function findImagesByChapter(name: string, chapter: string, lastedChapter: string) {
  return new Promise((resolve, reject) => {
    request(`${anzManga}/manga/${name}/${chapter}`, (err: any, res2: any, body: any) => {
      if (!err && res2.statusCode == 200) {
        const $ = cheerio.load(body);
        let images: any[] = [];
        let mangaName: any[] = [];

        $('img.img-responsive', '#all').each(function (this: HTMLElement) {
          images.push($(this).attr('data-src'));
        });

        $('ul.nav.navbar-nav > li > a', '#navbar-collapse-1').each(function (this: HTMLElement) {
          mangaName.push($(this).text());
        });

        mangaName = mangaName[0].replace(' Manga', '');

        const response = {
          name: mangaName,
          search: name,
          lastedChapter,
          chapter,
          images,
        };

        resolve(response);
      } else {
        reject(err);
      }
    });
  });
}
async function createPDFByBuffer(name: string, chapter: string, doc: any, urlImages: string[]) {
  try {

    interface BufferImages {
      data: Uint8Array;
      label: string;
      bits: number;
      height: number;
      width: number;
      colorSpace: string;
      obj: null;
    }

    const images: BufferImages[] = await getBufferImagesByUrl(urlImages);

    images.forEach((image: any) => {
      if (image) {
        doc.addPage({ size: [image.width, image.height] });

        const xPosition = (doc.page.width - image.width) / 2;
        const yPosition = (doc.page.height - image.height) / 2;

        doc.image(image.data, xPosition, yPosition, {
          width: image.width,
          height: image.height,
          align: 'center',
          valign: 'center',
          fit: [doc.page.width, doc.page.height],
        });

      } else {
        console.error('Error: la imagen no se ha cargado correctamente');
      }
    });

    return doc

  } catch (error) {
    console.error(error);
  }
}
async function downloadBufferImage(url: string, iterator: number) {
  const bufferStream = new PassThrough();

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  const chunks: any = [];
  response.data.on('data', (chunk: any) => chunks.push(chunk));
  response.data.on('end', () => bufferStream.end(Buffer.concat(chunks)));
  response.data.on('error', (err: any) => {
    console.error(`Error al descargar la imagen: ${err.message}`);
    bufferStream.emit('error', err)
  });

  const imageBuffer = await new Promise((resolve, reject) => {
    bufferStream.pipe(sharp()).toBuffer((err: any, buffer: any, info: any) => {
      if (err) reject(err);
      else {
        resolve({
          data: buffer,
          label: `I${iterator}`,
          bits: 8,
          height: info.height,
          width: info.width,
          colorSpace: 'DeviceRGB',
          obj: null
        });
      }
    });
  });

  return imageBuffer;
}
async function getUrlImagesByChapter(data: any) {

  let { req, chapter, name } = data;

  const requestChapters = await axios.get(
    `${req.protocol}://${req.get('host')}/api/anzmanga/findChaptersByName?name=${name}`
  )

  interface Chapter {
    chapter: string;
    url: string;
  }

  const chapters: Chapter[] = requestChapters.data.responseData

  const requestChapter: Chapter[] = chapters.filter(property => parseInt(property.chapter) == parseInt(chapter))
  const lastedChapter: string = chapters[0].chapter

  chapter = requestChapter[0].chapter

  interface ResponseFindChapter {
    name: string;
    search: string;
    lastedChapter: string;
    chapter: string;
    images: string[];
  }

  const imagesByChapter: any = await findImagesByChapter(name, chapter, lastedChapter)
  const urlImages: string[] = imagesByChapter?.images

  return {
    urlImages,
    chapter,
    name,
    search: imagesByChapter.search
  }
}

async function getBufferImagesByUrl(urlImages: string[]) {

  const images: any[] = [];

  for (const url of urlImages) {
    const JPEG = await downloadBufferImage(url, (urlImages.indexOf(url)) + 1);
    images.push(JPEG);
  }
  return images;

}