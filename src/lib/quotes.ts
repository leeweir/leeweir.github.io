export interface Quote {
  text: string;
  author: string;
  source: string;
  // Foreign quotations use Chinese translations on the homepage.
  // sourceText records the wording in the linked source (sometimes an English translation).
  sourceText?: string;
}

export const chineseQuotes = [
  { text: '业精于勤，荒于嬉。', author: '韩愈', source: 'https://zh.wikisource.org/wiki/進學解' },
  { text: '行成于思，毁于随。', author: '韩愈', source: 'https://zh.wikisource.org/wiki/進學解' },
  { text: '人非生而知之者，孰能无惑？', author: '韩愈', source: 'https://zh.wikisource.org/wiki/師說' },
  { text: '问渠那得清如许？为有源头活水来。', author: '朱熹', source: 'https://zh.wikisource.org/wiki/觀書有感' },
  { text: '尽吾志也，而不能至者，可以无悔矣。', author: '王安石', source: 'https://zh.wikisource.org/wiki/遊褒禪山記' },
  { text: '学者不可以不深思而慎取之也。', author: '王安石', source: 'https://zh.wikisource.org/wiki/遊褒禪山記' },
  { text: '不识庐山真面目，只缘身在此山中。', author: '苏轼', source: 'https://zh.wikisource.org/wiki/題西林壁' },
  { text: '苟非吾之所有，虽一毫而莫取。', author: '苏轼', source: 'https://zh.wikisource.org/wiki/前赤壁賦' },
  { text: '卒然临之而不惊，无故加之而不怒。', author: '苏轼', source: 'https://zh.wikisource.org/wiki/留侯論_(蘇軾)' },
  { text: '古人学问无遗力，少壮工夫老始成。', author: '陆游', source: 'https://zh.wikisource.org/wiki/冬夜讀書示子聿' },
  { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游', source: 'https://zh.wikisource.org/wiki/冬夜讀書示子聿' },
  { text: '盛年不重来，一日难再晨。', author: '陶渊明', source: 'https://zh.wikisource.org/wiki/雜詩_(陶淵明)' },
  { text: '悟已往之不谏，知来者之可追。', author: '陶渊明', source: 'https://zh.wikisource.org/wiki/歸去來辭' },
  { text: '经事还谙事，阅人如阅川。', author: '刘禹锡', source: 'https://zh.wikisource.org/wiki/酬樂天詠老見示' },
  { text: '千淘万漉虽辛苦，吹尽狂沙始到金。', author: '刘禹锡', source: 'https://zh.wikisource.org/wiki/浪淘沙九首' },
  { text: '静以修身，俭以养德。', author: '诸葛亮', source: 'https://zh.wikisource.org/wiki/誡子書' },
  { text: '非学无以广才，非志无以成学。', author: '诸葛亮', source: 'https://zh.wikisource.org/wiki/誡子書' },
  { text: '长风破浪会有时，直挂云帆济沧海。', author: '李白', source: 'https://zh.wikisource.org/wiki/行路難_(李白)' },
  { text: '读书破万卷，下笔如有神。', author: '杜甫', source: 'https://zh.wikisource.org/wiki/奉贈韋左丞丈二十二韻' },
  { text: '路曼曼其修远兮，吾将上下而求索。', author: '屈原', source: 'https://zh.wikisource.org/wiki/離騷' },
  { text: '老骥伏枥，志在千里。', author: '曹操', source: 'https://zh.wikisource.org/wiki/龜雖壽' },
  { text: '其实地上本没有路；走的人多了，也便成了路。', author: '鲁迅', source: 'https://zh.wikisource.org/wiki/故鄉' },
  { text: '能做事的做事，能发声的发声。', author: '鲁迅', source: 'https://zh.wikisource.org/wiki/熱風/隨感錄/四十一' },
  { text: '凡做一件事，便忠于一件事。', author: '梁启超', source: 'https://zh.wikisource.org/wiki/敬業與樂業' },
  { text: '知是行之始，行是知之成。', author: '王阳明', source: 'https://zh.wikisource.org/wiki/傳習錄/卷上' },
  { text: '人须在事上磨，方立得住，方能静亦定，动亦定。', author: '王阳明', source: 'https://zh.wikisource.org/wiki/傳習錄/卷上' },
  { text: '究天人之际，通古今之变，成一家之言。', author: '司马迁', source: 'https://zh.wikisource.org/wiki/報任少卿書' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子', source: 'https://m.guwendao.net/guwen/bookv_eec1d4c6eb80.aspx' },
  { text: '温故而知新，可以为师矣。', author: '孔子', source: 'https://m.guwendao.net/guwen/bookv_eec1d4c6eb80.aspx' },
  { text: '知之为知之，不知为不知，是知也。', author: '孔子', source: 'https://m.guwendao.net/guwen/bookv_eec1d4c6eb80.aspx' },
  { text: '欲速则不达，见小利则大事不成。', author: '孔子', source: 'https://m.guwendao.net/guwen/bookv_86b395de2480.aspx' },
  { text: '知人者智，自知者明。', author: '老子', source: 'https://www.daodejing.org/33.html' },
  { text: '胜人者有力，自胜者强。', author: '老子', source: 'https://www.daodejing.org/33.html' },
  { text: '千里之行，始于足下。', author: '老子', source: 'https://www.daodejing.org/64.html' },
  { text: '慎终如始，则无败事。', author: '老子', source: 'https://www.daodejing.org/64.html' },
  { text: '心之官则思，思则得之，不思则不得也。', author: '孟子', source: 'https://www.gutenberg.org/ebooks/24178' },
  { text: '人恒过，然后能改。', author: '孟子', source: 'https://www.gutenberg.org/ebooks/24178' },
  { text: '尽信书，则不如无书。', author: '孟子', source: 'https://www.gutenberg.org/ebooks/24178' },
  { text: '穷则独善其身，达则兼善天下。', author: '孟子', source: 'https://www.gutenberg.org/ebooks/24178' },
  { text: '吾尝终日而思矣，不如须臾之所学也。', author: '荀子', source: 'https://www.gushiwen.cn/shiwenv_c743b1310a1c.aspx' },
  { text: '君子生非异也，善假于物也。', author: '荀子', source: 'https://www.gushiwen.cn/shiwenv_c743b1310a1c.aspx' },
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子', source: 'https://www.gushiwen.cn/shiwenv_c743b1310a1c.aspx' },
  { text: '锲而舍之，朽木不折；锲而不舍，金石可镂。', author: '荀子', source: 'https://www.gushiwen.cn/shiwenv_c743b1310a1c.aspx' },
  { text: '道行之而成，物谓之而然。', author: '庄子', source: 'https://www.gushiwen.cn/shiwenv_70953a53a97e.aspx' },
  { text: '天地与我并生，而万物与我为一。', author: '庄子', source: 'https://www.gushiwen.cn/shiwenv_70953a53a97e.aspx' },
  { text: '故知止其所不知，至矣。', author: '庄子', source: 'https://www.gushiwen.cn/shiwenv_70953a53a97e.aspx' },
  { text: '士虽有学，而行为本焉。', author: '墨子', source: 'https://www.gutenberg.org/ebooks/24240' },
  { text: '志不强者智不达，言不信者行不果。', author: '墨子', source: 'https://www.gutenberg.org/ebooks/24240' },
  { text: '天下从事者，不可以无法仪。', author: '墨子', source: 'https://www.gutenberg.org/ebooks/24240' },
  { text: '事因于世，而备适于事。', author: '韩非', source: 'https://www.gutenberg.org/ebooks/24049' },
] as const satisfies readonly Quote[];

export const foreignQuotes = [
  {
    text: '凡我不能创造的，我就不能理解。', author: '理查德·费曼',
    sourceText: 'What I cannot create, I do not understand.',
    source: 'https://wanglab.caltech.edu/research',
  },
  {
    text: '首要的原则是不要欺骗自己，而你恰恰是最容易被自己欺骗的人。', author: '理查德·费曼',
    sourceText: 'The first principle is that you must not fool yourself—and you are the easiest person to fool.',
    source: 'https://calteches.library.caltech.edu/51/2/CargoCult.htm',
  },
  {
    text: '如果我看得更远，那是因为我站在巨人的肩上。', author: '艾萨克·牛顿',
    sourceText: 'If I have seen farther, it is by standing on the shoulders of giants.',
    source: 'https://www.newtonproject.ox.ac.uk/view/texts/normalized/OTHE00101#par29',
  },
  {
    text: '无知比知识更容易使人产生自信。', author: '查尔斯·达尔文',
    sourceText: 'Ignorance more frequently begets confidence than does knowledge.',
    source: 'https://www.gutenberg.org/ebooks/2300',
  },
  {
    text: '我们只能看见前方不远处，但已能看见那里有许多事要做。', author: '艾伦·图灵',
    sourceText: 'We can only see a short distance ahead, but we can see plenty there that needs to be done.',
    source: 'https://www.cs.virginia.edu/~robins/Turing_Paper_1950.pdf',
  },
  {
    text: '分析机并不企图创造任何东西；它能做的，是我们知道如何命令它去做的事。', author: '阿达·洛夫莱斯',
    sourceText: 'The Analytical Engine has no pretensions whatever to originate any thing. It can do whatever we know how to order it to perform.',
    source: 'https://www.fourmilab.ch/babbage/sketch.html',
  },
  {
    text: '我们使用的工具，会深刻影响我们的思维习惯，进而影响思考能力。', author: '艾兹格·迪杰斯特拉',
    sourceText: 'The tools we use have a profound (and devious!) influence on our thinking habits, and, therefore, on our thinking abilities.',
    source: 'https://www.cs.utexas.edu/~EWD/transcriptions/EWD04xx/EWD498.html',
  },
  {
    text: '与其给我爱、金钱或名望，不如给我真理。', author: '亨利·戴维·梭罗',
    sourceText: 'Rather than love, than money, than fame, give me truth.',
    source: 'https://www.gutenberg.org/ebooks/205',
  },
  {
    text: '我从未遇到比独处更好的伙伴。', author: '亨利·戴维·梭罗',
    sourceText: 'I never found the companion that was so companionable as solitude.',
    source: 'https://www.gutenberg.org/ebooks/205',
  },
  {
    text: '我们的生活被琐事消磨。', author: '亨利·戴维·梭罗',
    sourceText: 'Our life is frittered away by detail.',
    source: 'https://www.gutenberg.org/ebooks/205',
  },
  {
    text: '相信你自己：每颗心都会随这根铁弦而振动。', author: '拉尔夫·沃尔多·爱默生',
    sourceText: 'Trust thyself: every heart vibrates to that iron string.',
    source: 'https://www.gutenberg.org/ebooks/16643',
  },
  {
    text: '想成为真正独立的人，就不能一味随俗。', author: '拉尔夫·沃尔多·爱默生',
    sourceText: 'Whoso would be a man must be a nonconformist.',
    source: 'https://www.gutenberg.org/ebooks/16643',
  },
  {
    text: '读书使人充实，交谈使人机敏，写作使人精确。', author: '弗朗西斯·培根',
    sourceText: 'Reading maketh a full man; conference a ready man; and writing an exact man.',
    source: 'https://www.gutenberg.org/ebooks/575',
  },
  {
    text: '读书可以怡情，可以增采，可以长才。', author: '弗朗西斯·培根',
    sourceText: 'Studies serve for delight, for ornament, and for ability.',
    source: 'https://www.gutenberg.org/ebooks/575',
  },
  {
    text: '我思，故我在。', author: '勒内·笛卡尔',
    sourceText: 'I think, therefore I am.',
    source: 'https://www.gutenberg.org/ebooks/59',
  },
  {
    text: '要有勇气运用你自己的理智。', author: '伊曼努尔·康德',
    sourceText: 'Have courage to use your own understanding!',
    source: 'https://en.wikisource.org/wiki/What_is_Enlightenment%3F',
  },
  {
    text: '困扰人的不是事物本身，而是人对事物的看法。', author: '爱比克泰德',
    sourceText: 'Men are disturbed not by things, but by the views which they take of things.',
    source: 'https://www.gutenberg.org/ebooks/45109',
  },
  {
    text: '不要要求事情照你的愿望发生，而要愿它们如其所是。', author: '爱比克泰德',
    sourceText: 'Demand not that events should happen as you wish; but wish them to happen as they do happen, and you will go on well.',
    source: 'https://www.gutenberg.org/ebooks/45109',
  },
  {
    text: '最好的报复，就是不成为对方那样的人。', author: '马可·奥勒留',
    sourceText: 'The best way of avenging thyself is not to become like the wrong doer.',
    source: 'https://classics.mit.edu/Antoninus/meditations.6.six.html',
  },
  {
    text: '人找不到比自己内心更宁静、更少纷扰的退隐之所。', author: '马可·奥勒留',
    sourceText: 'Nowhere either with more quiet or more freedom from trouble does a man retire than into his own soul.',
    source: 'https://classics.mit.edu/Antoninus/meditations.4.four.html',
  },
  {
    text: '我们在想象中遭受的痛苦，往往比在现实中更多。', author: '塞涅卡',
    sourceText: 'We suffer more often in imagination than in reality.',
    source: 'https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_13',
  },
  {
    text: '在我们拖延的时候，生命正疾驰而过。', author: '塞涅卡',
    sourceText: 'While we are postponing, life speeds by.',
    source: 'https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_1',
  },
  {
    text: '未经审视的人生不值得过。', author: '苏格拉底',
    sourceText: 'The unexamined life is not worth living.',
    source: 'https://www.gutenberg.org/ebooks/1656',
  },
  {
    text: '事情本无好坏，是思想使它如此。', author: '威廉·莎士比亚',
    sourceText: 'There is nothing either good or bad, but thinking makes it so.',
    source: 'https://www.gutenberg.org/ebooks/1524',
  },
  {
    text: '我们知道自己是什么，却不知道自己可能成为什么。', author: '威廉·莎士比亚',
    sourceText: 'We know what we are, but know not what we may be.',
    source: 'https://www.gutenberg.org/ebooks/1524',
  },
  {
    text: '我们与梦由同样的材料构成，短暂的一生被睡眠环绕。', author: '威廉·莎士比亚',
    sourceText: 'We are such stuff as dreams are made on, and our little life is rounded with a sleep.',
    source: 'https://shakespeare.mit.edu/tempest/full.html',
  },
  {
    text: '没有什么魅力能胜过一颗温柔的心。', author: '简·奥斯汀',
    sourceText: 'There is no charm equal to tenderness of heart.',
    source: 'https://www.gutenberg.org/ebooks/158',
  },
  {
    text: '直到此刻，我才真正认识自己。', author: '简·奥斯汀',
    sourceText: 'Till this moment I never knew myself.',
    source: 'https://www.gutenberg.org/ebooks/1342',
  },
  {
    text: '这是最好的时代，这是最坏的时代。', author: '查尔斯·狄更斯',
    sourceText: 'It was the best of times, it was the worst of times.',
    source: 'https://www.gutenberg.org/ebooks/98',
  },
  {
    text: '能为别人减轻生活负担的人，在这世上就不是无用之人。', author: '查尔斯·狄更斯',
    sourceText: 'No one is useless in this world who lightens the burden of it for any one else.',
    source: 'https://www.gutenberg.org/ebooks/883',
  },
  {
    text: '我到底是谁？啊，这才是大问题。', author: '刘易斯·卡罗尔',
    sourceText: "Who in the world am I? Ah, that's the great puzzle!",
    source: 'https://www.gutenberg.org/ebooks/11',
  },
  {
    text: '回到昨天没有用，因为那时的我已经是另一个人。', author: '刘易斯·卡罗尔',
    sourceText: "It's no use going back to yesterday, because I was a different person then.",
    source: 'https://www.gutenberg.org/ebooks/11',
  },
  {
    text: '定义，就是限制。', author: '奥斯卡·王尔德',
    sourceText: 'To define is to limit.',
    source: 'https://www.gutenberg.org/ebooks/174',
  },
  {
    text: '真相很少纯粹，也从不简单。', author: '奥斯卡·王尔德',
    sourceText: 'The truth is rarely pure and never simple.',
    source: 'https://www.gutenberg.org/ebooks/844',
  },
  {
    text: '对人的心灵而言，没有什么比突如其来的巨变更令人痛苦。', author: '玛丽·雪莱',
    sourceText: 'Nothing is so painful to the human mind as a great and sudden change.',
    source: 'https://www.gutenberg.org/ebooks/84',
  },
  {
    text: '我不是鸟，也没有罗网能困住我；我是拥有独立意志的自由人。', author: '夏洛蒂·勃朗特',
    sourceText: 'I am no bird; and no net ensnares me: I am a free human being with an independent will.',
    source: 'https://www.gutenberg.org/ebooks/1260',
  },
  {
    text: '无论灵魂由什么构成，他的和我的都是一样的。', author: '艾米莉·勃朗特',
    sourceText: 'Whatever our souls are made of, his and mine are the same.',
    source: 'https://www.gutenberg.org/ebooks/768',
  },
  {
    text: '我们活着，若不是为了让彼此的生活少些艰难，又是为了什么？', author: '乔治·艾略特',
    sourceText: 'What do we live for, if it is not to make life less difficult to each other?',
    source: 'https://www.gutenberg.org/ebooks/145',
  },
  {
    text: '幸福的家庭都是相似的，不幸的家庭各有各的不幸。', author: '列夫·托尔斯泰',
    sourceText: 'Happy families are all alike; every unhappy family is unhappy in its own way.',
    source: 'https://www.gutenberg.org/ebooks/1399',
  },
  {
    text: '最重要的是，不要对自己说谎。', author: '费奥多尔·陀思妥耶夫斯基',
    sourceText: "Above all, don't lie to yourself.",
    source: 'https://www.gutenberg.org/ebooks/28054',
  },
  {
    text: '怀着希望前行，比抵达更美好。', author: '罗伯特·路易斯·史蒂文森',
    sourceText: 'To travel hopefully is a better thing than to arrive.',
    source: 'https://www.gutenberg.org/ebooks/386',
  },
  {
    text: '我辽阔博大，我包容万象。', author: '沃尔特·惠特曼',
    sourceText: 'I am large, I contain multitudes.',
    source: 'https://www.gutenberg.org/ebooks/1322',
  },
  {
    text: '我，或任何人，都不能替你走那条路；你必须自己去走。', author: '沃尔特·惠特曼',
    sourceText: 'Not I, not any one else can travel that road for you, You must travel it for yourself.',
    source: 'https://www.gutenberg.org/ebooks/1322',
  },
  {
    text: '希望是有羽毛的东西，栖息在灵魂里。', author: '艾米莉·狄金森',
    sourceText: 'Hope is the thing with feathers That perches in the soul.',
    source: 'https://www.poetryfoundation.org/poems/42889/hope-is-the-thing-with-feathers-314',
  },
  {
    text: '我居住在可能之中，那是比散文更美的屋宇。', author: '艾米莉·狄金森',
    sourceText: 'I dwell in Possibility — A fairer House than Prose —',
    source: 'https://www.poetryfoundation.org/poems/52197/i-dwell-in-possibility-466',
  },
  {
    text: '黄色的树林里分出两条路，可惜我不能同时涉足。', author: '罗伯特·弗罗斯特',
    sourceText: 'Two roads diverged in a yellow wood, And sorry I could not travel both.',
    source: 'https://www.poetryfoundation.org/poems/44272/the-road-not-taken',
  },
  {
    text: '树林可爱、幽暗而深邃，但我还有诺言要兑现。', author: '罗伯特·弗罗斯特',
    sourceText: 'The woods are lovely, dark and deep, But I have promises to keep.',
    source: 'https://www.poetryfoundation.org/poems/42891/stopping-by-woods-on-a-snowy-evening',
  },
  {
    text: '美的事物，是永恒的喜悦。', author: '约翰·济慈',
    sourceText: 'A thing of beauty is a joy for ever.',
    source: 'https://en.wikisource.org/wiki/The_complete_poetical_works_and_letters_of_John_Keats/Endymion',
  },
  {
    text: '心灵自成天地，能将地狱变成天堂，也能将天堂变成地狱。', author: '约翰·弥尔顿',
    sourceText: 'The mind is its own place, and in itself Can make a Heaven of Hell, a Hell of Heaven.',
    source: 'https://www.gutenberg.org/ebooks/26',
  },
  {
    text: '你必须改变你的生活。', author: '莱纳·马利亚·里尔克',
    sourceText: 'You must change your life.',
    source: 'https://www.poetryfoundation.org/poems/55272/archaic-torso-of-apollo',
  },
] as const satisfies readonly Quote[];

// Two explicit groups keep the 50/50 editorial balance easy to maintain.
export const quotes: readonly Quote[] = [...chineseQuotes, ...foreignQuotes];
