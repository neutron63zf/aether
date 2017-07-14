module.exports = {
    //アプリケーションの構造に関わるパス
    structure_path: {
        //コンパイル前の静的コンテンツがある場所
        //js,pug,scss,画像など
        //pugのtemplatesもある
        resource_path: 'resources',
        //コンパイル後の静的コンテンツがある場所
        //js,html,cssなど
        public_path: 'public',
        //動的コンテンツのある場所
        //nodejs,pugファイルがある
        express_path: 'views'
    },
    //js,img,css,tmpのフォルダのプレフィックス
    prefix_path: {
        js: 'js',
        img: 'img',
        css: 'css',
        tmp: 'tmp'
    }
};