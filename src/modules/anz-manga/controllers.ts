import express from "express";

const request = require('request');

const cheerio = require('cheerio');
const axios = require('axios')
const fs = require('fs');
const AdmZip = require('adm-zip');
const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');
const sharp = require('sharp');

export const router = express.Router();

export const findByName = async function (
    req: express.Request,
    res: express.Response
  ): Promise<any> {
    try {
      const search = req.query?.search
      
      interface Response {
        suggestions: Search[];
      }
      
      interface Search {
        value: string;
        data: string;
      }

      await axios.get(`https://www.anzmangashd.com/search?query=${search}`)
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
            responseCode: 200,
            responseMessage: "todo bien",
            responseData: error
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
      const search: any = req.query?.search
      const baseurl: any = req.get('host')

      await getChaptersUrl(search, baseurl)
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
          responseCode: 200,
          responseMessage: "todo bien",
          responseData: error
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

export const findChapter = async function (
    req: express.Request,
    res: express.Response
  ): Promise<any> {
    try {
      const name: any = req.query?.name
      let chapter: any = req.query?.chapter

      const requestChapters = await axios.get(
        `${req.protocol}://${req.get('host')}/api/anzmanga/findChaptersByName?search=${name}`
      )

      interface Chapter {
        chapter: string;
        url: string;
      }
      
      const chapters: Chapter[] = requestChapters.data.responseData

      const requestChapter: Chapter[] = chapters.filter(property => parseInt(property.chapter) == parseInt(chapter))
      const lastedChapter: string = chapters[0].chapter

      chapter = requestChapter[0].chapter
      
      await findImagesByChapter(name, chapter, lastedChapter)
        .then((response: any) => {
          res.json({
            responseCode: 200,
            responseMessage: "correctly collected data",
            responseData: response
          })
        })
        .catch((error: any) => {
          res.json({
            responseCode: 200,
            responseMessage: "todo bien",
            responseData: error
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


async function getChaptersUrl (search: string, baseurl: string) {
  return new Promise((resolve, reject) => {
    const url = `https://www.anzmangashd.com/manga/${search}`
    request( url, (err: any, res2: any, body: any) => {
      if (!err && res2.statusCode == 200) {
        const $ = cheerio.load(body);
        let chapters: any[] = [];

        $('ul.chapters > li > h5 > a').each(function(this: HTMLElement) {
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
            const chapterNumber = urlChapters[urlChapters.length -1];
            chapter = {
              chapter: chapterNumber,
              url: `${baseurl}/api/anzmanga/findChapter?chapter=${chapterNumber}`
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
async function findImagesByChapter (name: string, chapter: string, lastedChapter: string) {
  return new Promise((resolve, reject) => {
    request(`https://www.anzmangashd.com/manga/${name}/${chapter}`, (err: any, res2: any, body: any) => {
      if (!err && res2.statusCode == 200) {
        const $ = cheerio.load(body);
        let images: any[] = [];
        let mangaName: any[] = [];

        $('img.img-responsive', '#all').each(function(this: HTMLElement) {
          images.push($(this).attr('data-src'));
        });

        $('ul.nav.navbar-nav > li > a', '#navbar-collapse-1').each(function(this: HTMLElement) {
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
